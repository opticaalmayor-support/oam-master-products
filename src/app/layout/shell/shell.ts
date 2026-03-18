import { Component, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';


@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements AfterViewInit, OnDestroy {
  // Inyecta router para detectar cambios de ruta dentro del shell.
  private router = inject(Router);
  // Guarda la suscripcion para liberarla al destruir el componente.
  private navigationSub: Subscription | null = null;

  // Inicializa Flowbite al montar el shell y en cada cambio de ruta.
  ngAfterViewInit(): void {
    // Inicializa los componentes data-* presentes en el DOM actual.
    this.initFlowbiteComponents();

    // Re-inicializa componentes de Flowbite cuando cambia la ruta hija.
    this.navigationSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.initFlowbiteComponents();
      });
  }

  // Libera la suscripcion para evitar fugas de memoria.
  ngOnDestroy(): void {
    this.navigationSub?.unsubscribe();
  }

  // Ejecuta initFlowbite si la funcion global existe en window.
  private initFlowbiteComponents(): void {
    const windowWithFlowbite = window as Window & { initFlowbite?: () => void };

    if (typeof windowWithFlowbite.initFlowbite === 'function') {
      windowWithFlowbite.initFlowbite();
    }
  }
}
