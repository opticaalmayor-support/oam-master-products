// Importa decoradores y utilidades base de Angular para componentes, ciclo de vida, inyección y signals
import { Component, OnInit, inject, signal } from '@angular/core';

// Importa CommonModule para usar directivas comunes en el template
import { CommonModule } from '@angular/common';

// Importa el servicio encargado de consultar, crear, actualizar y eliminar productos master
import { ProductService } from '../../../../core/services/maestro/OamProducts.service';

// Importa el servicio encargado de crear variantes asociadas al product master
import { OamProductVariantService } from '../../../../core/services/maestro/OamProductVariant.service';

// Importa el componente hijo que renderiza y emite los filtros del listado
import { FilterProductPageComponent } from './components/filter-product-page.component';

// Importa utilidades de formularios reactivos para construir y validar formularios
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Importa las interfaces del modelo de producto, marca, colección y variante
import {
  OamProductMaster,
  OamBrand,
  OamCollection,
  OamProductVariant,
} from '../../../../core/models/product.model';

// Declara el componente standalone de la página de listado de productos
@Component({
  // Define el selector HTML del componente
  selector: 'app-products-list-page',

  // Indica que el componente es standalone
  standalone: true,

  // Registra los módulos y componentes que este componente necesita en su template
  imports: [CommonModule, ReactiveFormsModule, FilterProductPageComponent],

  // Define la ruta del archivo HTML asociado al componente
  templateUrl: './products-list-page.html',

  // Define la ruta del archivo de estilos asociado al componente
  styleUrl: './products-list-page.scss',
})
// Declara la clase principal del componente de listado de productos
export class ProductsListPage implements OnInit {
  // Inyecta el servicio de productos master usando la API moderna de inject
  private productService = inject(ProductService);

  // Inyecta el servicio de variantes para crear variantes asociadas al master
  private productVariantService = inject(OamProductVariantService);

  // Inyecta FormBuilder para construir formularios reactivos
  private fb = inject(FormBuilder);

  // Crea un signal reactivo que almacena la lista de productos cargados desde el backend
  public products = signal<OamProductMaster[]>([]);

  // Crea un signal reactivo que controla el estado de carga de la tabla principal
  public loading = signal<boolean>(false);

  // Crea un signal reactivo que controla si el drawer/formulario está abierto o cerrado
  public showForm = signal<boolean>(false);

  // Crea un signal reactivo que indica si el formulario está en modo edición
  public isEditMode = signal<boolean>(false);

  // Crea un signal reactivo que guarda el ID del producto seleccionado para editar
  public selectedProductId = signal<number | null>(null);

  // Guarda los filtros actuales que se enviarán al backend para recargar el listado
  public currentFilters: Record<string, any> = {};

  // Crea un signal reactivo para almacenar el catálogo de marcas que usará el padre
  public brands = signal<OamBrand[]>([]);

  // Crea un signal reactivo para almacenar el catálogo de colecciones que usará el padre
  public collections = signal<OamCollection[]>([]);

  // Construye el formulario reactivo principal para crear y editar productos master
  public productForm: FormGroup = this.fb.group({
    // Declara el control del campo oam_key y lo marca como requerido
    oam_key: ['', [Validators.required]],

    // Declara el control de familia del producto y le asigna un valor por defecto
    product_family: ['rx', [Validators.required]],

    // Declara el control del nombre plantilla y lo marca como requerido
    template_name: ['', [Validators.required]],

    // Declara el control de estado y le asigna valor activo por defecto
    status: ['active', [Validators.required]],

    // Declara el control de género y le asigna un valor por defecto consistente con el HTML
    gender: ['unisex', [Validators.required]],

    // Declara el control del UPC como opcional
    upc: [''],

    // Declara el control de marca como nullable porque puede no venir asignada
    brand_id: [null],

    // Declara el control de colección como nullable porque puede no venir asignada
    collection_id: [null],

    // Declara el control de descripción corta como opcional
    description_short: [''],

    // Declara el control del país de origen como opcional
    made_in: [''],

    // Declara el control de atributos como objeto vacío por defecto
    attributes: [{}],

    // Declara el control de características de lentes como objeto vacío por defecto
    lens_features: [{}],

    // Declara el control de galería como array vacío por defecto
    gallery_urls: [[]],
  });

  // Construye el formulario reactivo para crear variantes debajo del formulario master
  public variantForm: FormGroup = this.fb.group({
    // Declara el control del SKU interno de la variante y lo marca como requerido
    internal_sku: ['', [Validators.required]],

    // Declara el control del barcode como opcional
    barcode: [''],

    // Declara el control del código de color como opcional
    color_code: [''],

    // Declara el control de la descripción del color como opcional
    color_description: [''],

    // Declara el control del tamaño del lente como opcional
    size_lens: [''],

    // Declara el control del tamaño del puente como opcional
    size_bridge: [''],

    // Declara el control del tamaño de la varilla como opcional
    size_temple: [''],

    // Declara el control del tamaño estándar resumido como opcional
    size_std: [''],

    // Declara el control de la URL de imagen principal como opcional
    primary_image_url: [''],

    // Declara el control de estado activo de la variante con valor por defecto true
    is_active: [true],
  });

  // Hook del ciclo de vida que se ejecuta cuando el componente se inicializa
  ngOnInit(): void {
    // Carga el listado inicial de productos al entrar en la pantalla
    this.loadProducts();

    // Inicializa el catálogo de marcas vacío mientras conectas el servicio real
    this.brands.set([]);

    // Inicializa el catálogo de colecciones vacío mientras conectas el servicio real
    this.collections.set([]);
  }

  // Método encargado de consultar al backend la lista de productos según los filtros actuales
  loadProducts(): void {
    // Activa el estado de carga antes de hacer la petición HTTP
    this.loading.set(true);

    // Llama al servicio para obtener los productos usando los filtros vigentes
    this.productService.getProducts(this.currentFilters).subscribe({
      // Maneja la respuesta exitosa del backend
      next: (response) => {
        // Guarda la data recibida en el signal de productos o un array vacío si no vino data
        this.products.set(response?.data || []);

        // Desactiva el estado de carga cuando termina correctamente
        this.loading.set(false);
      },

      // Maneja cualquier error que ocurra durante la consulta
      error: (error) => {
        // Muestra el error en consola para depuración
        console.error('Error al cargar productos:', error);

        // Desactiva el estado de carga aunque la petición falle
        this.loading.set(false);
      },
    });
  }

  // Método que recibe los filtros emitidos por el componente hijo
  onUpdateFilters(filters: Record<string, any>): void {
    // Reemplaza los filtros actuales por los nuevos filtros emitidos
    this.currentFilters = filters;

    // Vuelve a cargar el listado aplicando los nuevos filtros
    this.loadProducts();
  }

  // Método que abre el drawer/formulario en modo creación
  openCreateModal(): void {
    // Marca que el formulario no está en modo edición
    this.isEditMode.set(false);

    // Limpia el ID seleccionado porque se creará un nuevo registro
    this.selectedProductId.set(null);

    // Reinicia el formulario del product master con valores por defecto consistentes con el modelo y la UI
    this.productForm.reset({
      // Limpia la clave interna del producto
      oam_key: '',

      // Restablece la familia del producto al valor por defecto
      product_family: 'rx',

      // Limpia el nombre plantilla
      template_name: '',

      // Restablece el estado al valor por defecto
      status: 'active',

      // Restablece el género al valor por defecto
      gender: 'unisex',

      // Limpia el UPC
      upc: '',

      // Limpia la marca seleccionada
      brand_id: null,

      // Limpia la colección seleccionada
      collection_id: null,

      // Limpia la descripción corta
      description_short: '',

      // Limpia el país de origen
      made_in: '',

      // Restablece los atributos a objeto vacío
      attributes: {},

      // Restablece las características de lentes a objeto vacío
      lens_features: {},

      // Restablece la galería a array vacío
      gallery_urls: [],
    });

    // Reinicia el formulario de variante para evitar arrastrar datos anteriores
    this.variantForm.reset({
      // Limpia el SKU interno
      internal_sku: '',

      // Limpia el barcode
      barcode: '',

      // Limpia el código de color
      color_code: '',

      // Limpia la descripción de color
      color_description: '',

      // Limpia el tamaño del lente
      size_lens: '',

      // Limpia el tamaño del puente
      size_bridge: '',

      // Limpia el tamaño de la varilla
      size_temple: '',

      // Limpia el tamaño estándar
      size_std: '',

      // Limpia la URL de imagen principal
      primary_image_url: '',

      // Restablece la variante como activa por defecto
      is_active: true,
    });

    // Abre el drawer del formulario
    this.showForm.set(true);
  }

  // Método que abre el drawer/formulario en modo edición con los datos del producto seleccionado
  openEditModal(product: OamProductMaster): void {
    // Marca que el formulario está en modo edición
    this.isEditMode.set(true);

    // Guarda el ID del producto que será editado
    this.selectedProductId.set(product.id);

    // Carga en el formulario los valores del producto recibido
    this.productForm.patchValue({
      // Asigna la clave interna del producto al formulario
      oam_key: product.oam_key,

      // Asigna la familia del producto al formulario
      product_family: product.product_family,

      // Asigna el nombre plantilla al formulario
      template_name: product.template_name,

      // Asigna el estado actual al formulario
      status: product.status,

      // Asigna el género actual al formulario
      gender: product.gender,

      // Asigna el UPC si existe o string vacío si no viene
      upc: product.upc || '',

      // Asigna el brand_id si existe o null si no viene
      brand_id: product.brand_id ?? null,

      // Asigna el collection_id si existe o null si no viene
      collection_id: product.collection_id ?? null,

      // Asigna la descripción corta si existe o string vacío si no viene
      description_short: product.description_short || '',

      // Asigna el país de origen si existe o string vacío si no viene
      made_in: product.made_in || '',

      // Asigna los atributos si existen o un objeto vacío si no vienen
      attributes: product.attributes || {},

      // Asigna las características de lentes si existen o un objeto vacío si no vienen
      lens_features: product.lens_features || {},

      // Asigna la galería si existe o array vacío si no viene
      gallery_urls: product.gallery_urls || [],
    });

    // Reinicia el formulario de variante al abrir edición de master para nueva alta contextual
    this.variantForm.reset({
      // Limpia el SKU interno
      internal_sku: '',

      // Limpia el barcode
      barcode: '',

      // Limpia el código de color
      color_code: '',

      // Limpia la descripción de color
      color_description: '',

      // Limpia el tamaño del lente
      size_lens: '',

      // Limpia el tamaño del puente
      size_bridge: '',

      // Limpia el tamaño de la varilla
      size_temple: '',

      // Limpia el tamaño estándar
      size_std: '',

      // Limpia la URL de imagen principal
      primary_image_url: '',

      // Restablece la variante como activa
      is_active: true,
    });

    // Abre el drawer del formulario
    this.showForm.set(true);
  }

  // Método que cierra el drawer y limpia el estado de edición
  closeForm(): void {
    // Cierra el drawer lateral del formulario
    this.showForm.set(false);

    // Marca que ya no estamos en modo edición
    this.isEditMode.set(false);

    // Limpia el ID seleccionado porque ya no hay producto activo en edición
    this.selectedProductId.set(null);

    // Reinicia el formulario de variante para dejarlo limpio al cerrar
    this.variantForm.reset({
      // Limpia el SKU interno
      internal_sku: '',

      // Limpia el barcode
      barcode: '',

      // Limpia el código de color
      color_code: '',

      // Limpia la descripción de color
      color_description: '',

      // Limpia el tamaño del lente
      size_lens: '',

      // Limpia el tamaño del puente
      size_bridge: '',

      // Limpia el tamaño de la varilla
      size_temple: '',

      // Limpia el tamaño estándar
      size_std: '',

      // Limpia la URL de imagen principal
      primary_image_url: '',

      // Restablece el estado activo de la variante
      is_active: true,
    });
  }

  // Método que determina si ya existe un Product Master persistido y por tanto se pueden gestionar variantes
  canManageVariants(): boolean {
    // Retorna true cuando existe un ID seleccionado del product master, normalmente en modo edición
    return this.selectedProductId() !== null;
  }

  // Método que guarda el formulario creando o actualizando el Product Master según el modo actual
  onSaveProduct(): void {
    // Verifica si el formulario es inválido antes de intentar guardar
    if (this.productForm.invalid) {
      // Marca todos los campos como tocados para mostrar validaciones en pantalla
      this.productForm.markAllAsTouched();

      // Sale del método para evitar enviar datos inválidos al backend
      return;
    }

    // Obtiene todos los valores crudos del formulario, incluyendo campos deshabilitados si existieran
    const raw = this.productForm.getRawValue();

    // Construye el payload final convirtiendo brand_id y collection_id a número o null
    const payload = {
      // Copia todos los valores del formulario
      ...raw,

      // Convierte la marca a number si viene valor o null si no viene
      brand_id: raw.brand_id ? Number(raw.brand_id) : null,

      // Convierte la colección a number si viene valor o null si no viene
      collection_id: raw.collection_id ? Number(raw.collection_id) : null,
    };

    // Verifica si estamos editando y además existe un ID seleccionado
    if (this.isEditMode() && this.selectedProductId()) {
      // Llama al servicio para actualizar el producto existente
      this.productService.updateProduct(this.selectedProductId()!, payload).subscribe({
        // Maneja la actualización exitosa
        next: () => {
          // Cierra el formulario después de actualizar
          this.closeForm();

          // Recarga la tabla para reflejar los cambios
          this.loadProducts();
        },

        // Maneja cualquier error ocurrido durante la actualización
        error: (error) => {
          // Muestra el error en consola para depuración
          console.error('Error al actualizar producto:', error);
        },
      });

      // Sale del método para no ejecutar la lógica de creación
      return;
    }

    // Si no estamos editando, llama al servicio para crear un nuevo producto
    this.productService.createProduct(payload).subscribe({
      next: (response) => {
        const createdId = response?.id ?? null;

        if (createdId) {
          this.selectedProductId.set(createdId);
          this.isEditMode.set(true);
        } else {
          this.closeForm();
        }

        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al crear producto:', error);
      },
    });
  }

  // Método que guarda una variante asociada al Product Master actual
  onSaveVariant(): void {
    // Verifica si existe un Product Master persistido antes de permitir crear variantes
    if (!this.canManageVariants()) {
      // Muestra mensaje de advertencia en consola para depuración
      console.warn('Debes guardar primero el Product Master antes de crear variantes.');

      // Sale del método para evitar variantes huérfanas
      return;
    }

    // Verifica si el formulario de variante es inválido
    if (this.variantForm.invalid) {
      // Marca todos los campos del formulario de variante como tocados
      this.variantForm.markAllAsTouched();

      // Sale del método para evitar enviar datos inválidos
      return;
    }

    // Obtiene todos los valores actuales del formulario de variante
    const raw = this.variantForm.getRawValue();

    // Construye el payload final agregando el product_master_id seleccionado
    const payload: Partial<OamProductVariant> = {
      // Asocia automáticamente la variante al Product Master actual
      product_master_id: this.selectedProductId()!,

      // Asigna el SKU interno de la variante
      internal_sku: raw.internal_sku,

      // Asigna el barcode o null si viene vacío
      barcode: raw.barcode || null,

      // Asigna el código de color o null si viene vacío
      color_code: raw.color_code || null,

      // Asigna la descripción de color o null si viene vacía
      color_description: raw.color_description || null,

      // Asigna el tamaño del lente o null si viene vacío
      size_lens: raw.size_lens || null,

      // Asigna el tamaño del puente o null si viene vacío
      size_bridge: raw.size_bridge || null,

      // Asigna el tamaño de la varilla o null si viene vacío
      size_temple: raw.size_temple || null,

      // Asigna el tamaño estándar o null si viene vacío
      size_std: raw.size_std || null,

      // Asigna la URL de imagen principal o null si viene vacía
      primary_image_url: raw.primary_image_url || null,

      // Asigna el estado activo como booleano real
      is_active: !!raw.is_active,
    };

    // Llama al servicio para crear la nueva variante
    this.productVariantService.createVariant(payload).subscribe({
      // Maneja la creación exitosa de la variante
      next: () => {
        // Reinicia el formulario de variante para permitir registrar otra rápidamente
        this.variantForm.reset({
          internal_sku: '',
          barcode: '',
          color_code: '',
          color_description: '',
          size_lens: '',
          size_bridge: '',
          size_temple: '',
          size_std: '',
          primary_image_url: '',
          is_active: true,
        });

        // Muestra en consola confirmación temporal
        console.log('Variante creada correctamente.');
      },

      // Maneja cualquier error ocurrido durante la creación de la variante
      error: (error) => {
        // Muestra el error en consola para depuración
        console.error('Error al crear variante:', error);
      },
    });
  }

  // Método que elimina un producto por su ID
  onDeleteProduct(id: number): void {
    // Muestra una confirmación antes de ejecutar la eliminación
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este producto?');

    // Si el usuario cancela la confirmación, detiene la ejecución
    if (!confirmed) {
      // Sale del método sin eliminar nada
      return;
    }

    // Llama al servicio para eliminar el producto seleccionado
    this.productService.deleteProduct(id).subscribe({
      // Maneja la eliminación exitosa
      next: () => {
        // Recarga el listado para reflejar el registro eliminado
        this.loadProducts();
      },

      // Maneja cualquier error ocurrido durante la eliminación
      error: (error) => {
        // Muestra el error en consola para depuración
        console.error('Error al eliminar producto:', error);
      },
    });
  }
}
