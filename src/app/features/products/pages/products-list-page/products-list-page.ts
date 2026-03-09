// Importa los decoradores y utilidades básicas de Angular
import { Component, OnInit, inject, signal } from '@angular/core';

// Importa CommonModule para usar directivas comunes en el HTML
import { CommonModule } from '@angular/common';

// Importa el servicio que consume el API de productos
import { ProductService } from '../../../../core/services/maestro/OamProducts.service';

// Importa la interfaz del producto master
import { OamProductMaster } from '../../../../core/models/product.model';

// Importa el componente hijo de filtros
import { FilterProductPageComponent } from './components/filter-product-page.component';

// Importa utilidades para formularios reactivos
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Declara el componente standalone
@Component({
  // Selector para usar este componente en HTML
  selector: 'app-products-list-page',

  // Indica que es standalone
  standalone: true,

  // Importa módulos y componentes necesarios
  imports: [CommonModule, ReactiveFormsModule, FilterProductPageComponent],

  // Archivo HTML asociado
  templateUrl: './products-list-page.html',

  // Archivo SCSS asociado
  styleUrl: './products-list-page.scss',
})
// Declara la clase principal del listado
export class ProductsListPage implements OnInit {
  // Inyecta el servicio de productos usando inject()
  private productService = inject(ProductService);

  // Inyecta FormBuilder para construir el formulario reactivo
  private fb = inject(FormBuilder);

  // Signal que guarda la lista de productos cargados desde el backend
  public products = signal<OamProductMaster[]>([]);

  // Signal que controla el estado de carga de la tabla
  public loading = signal<boolean>(false);

  // Signal que abre o cierra el drawer/modal lateral
  public showForm = signal<boolean>(false);

  // Signal que indica si estamos en modo edición
  public isEditMode = signal<boolean>(false);

  // Guarda el ID del producto seleccionado para editar
  public selectedProductId = signal<number | null>(null);

  // Objeto que mantiene los filtros actuales aplicados al listado
  public currentFilters: Record<string, any> = {};

  // Construye el formulario reactivo con sus validaciones básicas
  public productForm: FormGroup = this.fb.group({
    // Clave interna única del producto
    oam_key: ['', [Validators.required]],

    // Familia del producto
    product_family: ['rx', [Validators.required]],

    // Nombre plantilla o nombre base comercial
    template_name: ['', [Validators.required]],

    // Estado administrativo del producto
    status: ['active', [Validators.required]],

    // Género del producto
    gender: ['unisex', [Validators.required]],

    // UPC opcional
    upc: [''],

    // ID de la marca
    brand_id: [null],

    // ID de la colección
    collection_id: [null],

    // Descripción corta
    description_short: [''],

    // País de origen
    made_in: [''],

    // JSON de atributos
    attributes: [{}],

    // JSON de características de lentes
    lens_features: [{}],

    // Galería de imágenes
    gallery_urls: [[]],
  });

  // Hook de inicialización del componente
  ngOnInit(): void {
    // Carga los productos al entrar en la pantalla
    this.loadProducts();
  }

  // Método para cargar el listado de productos usando los filtros actuales
  loadProducts(): void {
    // Activa el estado de carga
    this.loading.set(true);

    // Llama al endpoint de productos
    this.productService.getProducts(this.currentFilters).subscribe({
      // Si la respuesta es exitosa
      next: (response) => {
        // Guarda la lista en el signal; si no viene data, usa array vacío
        this.products.set(response?.data || []);

        // Desactiva el loading
        this.loading.set(false);
      },

      // Si ocurre error en la petición
      error: (error) => {
        // Muestra el error en consola
        console.error('Error al cargar productos:', error);

        // Desactiva el loading
        this.loading.set(false);
      },
    });
  }

  // Recibe los filtros emitidos por el componente hijo
  onUpdateFilters(filters: Record<string, any>): void {
    // Guarda la nueva colección de filtros
    this.currentFilters = filters;

    // Recarga la tabla con los nuevos filtros
    this.loadProducts();
  }

  // Abre el drawer en modo creación
  openCreateModal(): void {
    // Indica que no estamos editando
    this.isEditMode.set(false);

    // Limpia el ID seleccionado
    this.selectedProductId.set(null);

    // Reinicia el formulario con valores por defecto consistentes con el HTML
    this.productForm.reset({
      oam_key: '',
      product_family: 'rx',
      template_name: '',
      status: 'active',
      gender: 'unisex',
      upc: '',
      brand_id: null,
      collection_id: null,
      description_short: '',
      made_in: '',
      attributes: {},
      lens_features: {},
      gallery_urls: [],
    });

    // Abre el drawer
    this.showForm.set(true);
  }

  // Abre el drawer en modo edición
  openEditModal(product: OamProductMaster): void {
    // Marca que estamos editando
    this.isEditMode.set(true);

    // Guarda el ID del producto a editar
    this.selectedProductId.set(product.id);

    // Llena el formulario con la información del producto recibido
    this.productForm.patchValue({
      oam_key: product.oam_key,
      product_family: product.product_family,
      template_name: product.template_name,
      status: product.status,
      gender: product.gender,
      upc: product.upc || '',
      brand_id: product.brand_id ?? null,
      collection_id: product.collection_id ?? null,
      description_short: product.description_short || '',
      made_in: product.made_in || '',
      attributes: product.attributes || {},
      lens_features: product.lens_features || {},
      gallery_urls: product.gallery_urls || [],
    });

    // Abre el drawer
    this.showForm.set(true);
  }

  // Cierra el drawer lateral
  closeForm(): void {
    // Cierra el panel
    this.showForm.set(false);

    // Limpia estado de edición
    this.isEditMode.set(false);

    // Limpia ID seleccionado
    this.selectedProductId.set(null);
  }

  // Guarda el formulario, creando o actualizando según el modo
  onSaveProduct(): void {
    // Si el formulario es inválido, no continúa
    if (this.productForm.invalid) {
      // Marca todos los campos como tocados para mostrar errores
      this.productForm.markAllAsTouched();

      // Sale del método
      return;
    }

    // Extrae el payload del formulario
    const payload = this.productForm.getRawValue();

    // Si estamos en modo edición y existe ID seleccionado
    if (this.isEditMode() && this.selectedProductId()) {
      // Ejecuta actualización en backend
      this.productService.updateProduct(this.selectedProductId()!, payload).subscribe({
        // Si actualiza correctamente
        next: () => {
          // Cierra el drawer
          this.closeForm();

          // Recarga el listado
          this.loadProducts();
        },

        // Si falla la actualización
        error: (error) => {
          // Muestra error en consola
          console.error('Error al actualizar producto:', error);
        },
      });

      // Sale para no ejecutar create
      return;
    }

    // Si no es edición, crea un nuevo producto
    this.productService.createProduct(payload).subscribe({
      // Si crea correctamente
      next: () => {
        // Cierra el drawer
        this.closeForm();

        // Recarga el listado
        this.loadProducts();
      },

      // Si falla el create
      error: (error) => {
        // Muestra error en consola
        console.error('Error al crear producto:', error);
      },
    });
  }

  // Elimina un producto por ID
  onDeleteProduct(id: number): void {
    // Pide confirmación al usuario antes de borrar
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este producto?');

    // Si cancela, no continúa
    if (!confirmed) {
      return;
    }

    // Llama al servicio para eliminar el producto
    this.productService.deleteProduct(id).subscribe({
      // Si elimina correctamente
      next: () => {
        // Recarga el listado actualizado
        this.loadProducts();
      },

      // Si ocurre error al eliminar
      error: (error) => {
        // Muestra el error en consola
        console.error('Error al eliminar producto:', error);
      },
    });
  }
}
