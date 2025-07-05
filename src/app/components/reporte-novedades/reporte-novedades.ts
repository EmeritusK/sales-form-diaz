import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Vendedor, Cliente, Producto, EntradaReporte, CreateEntradaReporte, PaginationResult, ClienteFilters } from '../../services/supabase.service';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';


// Interfaces locales
export interface EntradaLocal {
  id: number;
  factura: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precioFacturado: number;
  precioOfrecido: number;
  diferencia: number;
  totalDescuento: number;
}

interface ReporteLocal {
  vendedor: string;
  fecha: string;
  observaciones: string;
  entradas: EntradaLocal[];
  resumen: {
    totalEntradas: number;
    totalDescuentos: number;
    promedioDescuento: number;
  };
  fechaEnvio: string;
}

@Component({
  selector: 'app-reporte-novedades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    MultiSelectModule,
    TableModule,
    CardModule,
    PanelModule,
    MessageModule,
    MessagesModule,
    ProgressSpinnerModule,
    DialogModule,
    PasswordModule,
    DividerModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './reporte-novedades.html',
  styleUrl: './reporte-novedades.css'
})
export class ReporteNovedadesComponent implements OnInit {
  // Datos del formulario
  reporte = {
    vendedor_id: null as number | null,
    vendedor_nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ''
  };

  // Lista de entradas
  entradas: EntradaLocal[] = [];

  // Nueva transacción para agregar
  nuevaTransaccion: EntradaLocal = {
    id: 0,
    factura: '',
    cliente: '',
    producto: '',
    cantidad: 1,
    precioFacturado: 0,
    precioOfrecido: 0,
    diferencia: 0,
    totalDescuento: 0
  };

  // Datos de referencia
  vendedores: Vendedor[] = [];
  clientes: Cliente[] = [];
  productos: Producto[] = [];

  // Variables para lazy loading de clientes
  clientesPaginated: PaginationResult<Cliente> | null = null;
  currentPage = 1;
  pageSize = 5;
  searchTerm = '';
  isLoadingMoreClientes = false;

  // Variables para lazy loading de productos
  productosPaginated: PaginationResult<Producto> | null = null;
  currentPageProductos = 1;
  pageSizeProductos = 5;
  searchTermProductos = '';
  isLoadingMoreProductos = false;

  // Estados de carga
  isLoading = false;
  isLoadingVendedores = false;
  isLoadingClientes = false;
  isLoadingProductos = false;

  // Mensajes
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Variables para descarga de CSV
  csvPassword = '';
  showCsvPasswordModal = false;

  // Variables para modales de creación
  showVendedorModal = false;
  showClienteModal = false;
  showProductoModal = false;
  nuevoVendedorNombre = '';
  nuevoClienteNombre = '';
  nuevoProductoNombre = '';;

  // Variables para rastrear valores anteriores
  private lastVendedorValue = '';
  private lastClienteValue = '';
  private lastProductoValue = '';

  constructor(
    private supabaseService: SupabaseService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Solo cargar datos si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.loadReferenceData();
    }
  }

  async loadReferenceData(): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🔄 No cargando datos de referencia en el servidor');
      return;
    }

    try {
      // Cargar vendedores
      this.isLoadingVendedores = true;
      this.vendedores = await this.supabaseService.getVendedores();
      this.isLoadingVendedores = false;

      // Cargar clientes con lazy loading
      await this.loadClientesPaginated();

      // Cargar productos con lazy loading
      await this.loadProductosPaginated();

    } catch (error) {
      console.error('Error cargando datos de referencia:', error);
      this.showMessage('Error cargando datos de referencia. Verifica tu conexión a internet.', 'error');
      // Resetear estados de carga
      this.isLoadingVendedores = false;
      this.isLoadingClientes = false;
      this.isLoadingProductos = false;
    }
  }

  // Método para cargar clientes con paginación
  async loadClientesPaginated(page: number = 1, append: boolean = false): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.isLoadingClientes = true;

      const result = await this.supabaseService.getClientesPaginated(
        page,
        this.pageSize,
        this.searchTerm,
        true
      );

      if (append && this.clientesPaginated) {
        // Agregar nuevos clientes a la lista existente
        this.clientesPaginated.data = [...this.clientesPaginated.data, ...result.data];
        this.clientesPaginated.page = result.page;
        this.clientesPaginated.totalPages = result.totalPages;
      } else {
        // Reemplazar completamente
        this.clientesPaginated = result;
      }

      // Actualizar la lista de clientes para compatibilidad
      this.clientes = this.clientesPaginated.data;
      this.currentPage = result.page;

      this.isLoadingClientes = false;
    } catch (error) {
      console.error('Error cargando clientes paginados:', error);
      this.showMessage('Error cargando clientes. Verifica tu conexión a internet.', 'error');
      this.isLoadingClientes = false;
    }
  }

  // Método para cargar más clientes (lazy loading)
  async loadMoreClientes(): Promise<void> {
    if (this.isLoadingMoreClientes || !this.clientesPaginated) {
      return;
    }

    if (this.currentPage >= this.clientesPaginated.totalPages) {
      return; // Ya no hay más páginas
    }

    try {
      this.isLoadingMoreClientes = true;
      await this.loadClientesPaginated(this.currentPage + 1, true);
      this.isLoadingMoreClientes = false;
    } catch (error) {
      console.error('Error cargando más clientes:', error);
      this.isLoadingMoreClientes = false;
    }
  }

  // Método para búsqueda de clientes
  async searchClientes(search: string): Promise<void> {
    this.searchTerm = search;
    this.currentPage = 1;
    await this.loadClientesPaginated(1, false);
  }

  // Método para búsqueda global de clientes (para autocompletado)
  async searchClientesGlobal(search: string): Promise<Cliente[]> {
    if (!search || search.length < 2) {
      return [];
    }

    try {
      return await this.supabaseService.searchClientes(search, 10);
    } catch (error) {
      console.error('Error en búsqueda global de clientes:', error);
      return [];
    }
  }

  // Método para manejar el filtro de clientes
  async onClienteFilter(event: any): Promise<void> {
    const filterValue = event.filter;
    if (filterValue && filterValue.length >= 2) {
      // Realizar búsqueda global
      const resultados = await this.searchClientesGlobal(filterValue);
      // Actualizar la lista de clientes con los resultados de búsqueda
      this.clientes = resultados;
    } else if (filterValue === '') {
      // Si el filtro está vacío, cargar la primera página
      await this.loadClientesPaginated(1, false);
    }
  }

  // Método para cargar productos con paginación
  async loadProductosPaginated(page: number = 1, append: boolean = false): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.isLoadingProductos = true;

      const result = await this.supabaseService.getProductosPaginated(
        page,
        this.pageSizeProductos,
        this.searchTermProductos,
        true
      );

      if (append && this.productosPaginated) {
        // Agregar nuevos productos a la lista existente
        this.productosPaginated.data = [...this.productosPaginated.data, ...result.data];
        this.productosPaginated.page = result.page;
        this.productosPaginated.totalPages = result.totalPages;
      } else {
        // Reemplazar completamente
        this.productosPaginated = result;
      }

      // Actualizar la lista de productos para compatibilidad
      this.productos = this.productosPaginated.data;
      this.currentPageProductos = result.page;

      this.isLoadingProductos = false;
    } catch (error) {
      console.error('Error cargando productos paginados:', error);
      this.showMessage('Error cargando productos. Verifica tu conexión a internet.', 'error');
      this.isLoadingProductos = false;
    }
  }

  // Método para cargar más productos (lazy loading)
  async loadMoreProductos(): Promise<void> {
    if (this.isLoadingMoreProductos || !this.productosPaginated) {
      return;
    }

    if (this.currentPageProductos >= this.productosPaginated.totalPages) {
      return; // Ya no hay más páginas
    }

    try {
      this.isLoadingMoreProductos = true;
      await this.loadProductosPaginated(this.currentPageProductos + 1, true);
      this.isLoadingMoreProductos = false;
    } catch (error) {
      console.error('Error cargando más productos:', error);
      this.isLoadingMoreProductos = false;
    }
  }

  // Método para búsqueda de productos
  async searchProductos(search: string): Promise<void> {
    this.searchTermProductos = search;
    this.currentPageProductos = 1;
    await this.loadProductosPaginated(1, false);
  }

  // Método para búsqueda global de productos (para autocompletado)
  async searchProductosGlobal(search: string): Promise<Producto[]> {
    if (!search || search.length < 2) {
      return [];
    }

    try {
      return await this.supabaseService.searchProductos(search, 10);
    } catch (error) {
      console.error('Error en búsqueda global de productos:', error);
      return [];
    }
  }

  // Método para manejar el filtro de productos
  async onProductoFilter(event: any): Promise<void> {
    const filterValue = event.filter;
    if (filterValue && filterValue.length >= 2) {
      // Realizar búsqueda global
      const resultados = await this.searchProductosGlobal(filterValue);
      // Actualizar la lista de productos con los resultados de búsqueda
      this.productos = resultados;
    } else if (filterValue === '') {
      // Si el filtro está vacío, cargar la primera página
      await this.loadProductosPaginated(1, false);
    }
  }

  // Métodos para gestionar entradas
  addEntrada(): void {
    this.entradas.push({
      id: this.entradas.length + 1,
      factura: '',
      cliente: '',
      producto: '',
      cantidad: 1,
      precioFacturado: 0,
      precioOfrecido: 0,
      diferencia: 0,
      totalDescuento: 0
    });
  }

  removeEntrada(id: number): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar esta transacción?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, eliminar',
      rejectLabel: 'No, cancelar',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.entradas = this.entradas.filter(entrada => entrada.id !== id);
        this.showMessage('Transacción eliminada exitosamente', 'success');
      },
      reject: () => {
        // No hacer nada si el usuario cancela
      }
    });
  }

  // Calcular diferencias automáticamente
  calcularDiferencias(entrada: EntradaLocal): void {
    entrada.diferencia = entrada.precioFacturado - entrada.precioOfrecido;
    entrada.totalDescuento = entrada.diferencia * entrada.cantidad;
  }

  // Obtener totales
  getTotalDescuentos(): number {
    return this.entradas.reduce((total, entrada) => total + entrada.totalDescuento, 0);
  }

  getTotalEntradas(): number {
    return this.entradas.length;
  }

  // Validaciones
  isFormValid(): boolean {
    if (!this.reporte.vendedor_nombre || !this.reporte.fecha) {
      return false;
    }

    return this.entradas.every(entrada =>
      entrada.factura &&
      entrada.cliente &&
      entrada.producto &&
      entrada.cantidad > 0 &&
      entrada.precioFacturado > 0 &&
      entrada.precioOfrecido > 0
    );
  }

  // Guardar reporte
  async guardarReporte(): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      this.showMessage('No se puede guardar en el servidor', 'error');
      return;
    }

    if (!this.isFormValid()) {
      this.showMessage('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    this.isLoading = true;

    try {
      // Buscar el vendedor por nombre o crear uno nuevo si no existe
      let vendedor = this.vendedores.find(v => v.nombre === this.reporte.vendedor_nombre);

      if (!vendedor) {
        // Si no existe el vendedor, lo creamos
        vendedor = await this.supabaseService.createVendedor({
          nombre: this.reporte.vendedor_nombre,
          email: `${this.reporte.vendedor_nombre.toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
          telefono: '',
          activo: true
        });
      }

      // Crear el reporte
      const reporteCreado = await this.supabaseService.createReporte({
        vendedor_id: vendedor.id,
        fecha: this.reporte.fecha,
        observaciones: this.reporte.observaciones
      });

      // Preparar las entradas para guardar
      const entradasParaGuardar: CreateEntradaReporte[] = [];

      for (const entrada of this.entradas) {
        // Buscar cliente y producto directamente en la base de datos
        const clientesEncontrados = await this.supabaseService.searchClientes(entrada.cliente);
        const productosEncontrados = await this.supabaseService.searchProductos(entrada.producto);

        const cliente = clientesEncontrados.find((c: Cliente) => c.nombre === entrada.cliente);
        const producto = productosEncontrados.find((p: Producto) => p.nombre === entrada.producto);

        if (!cliente || !producto) {
          throw new Error(`Cliente o producto no encontrado: ${entrada.cliente} / ${entrada.producto}`);
        }

        entradasParaGuardar.push({
          reporte_id: reporteCreado.id,
          factura: entrada.factura,
          cliente_id: cliente.id,
          producto_id: producto.id,
          cantidad: entrada.cantidad,
          precio_facturado: entrada.precioFacturado,
          precio_ofrecido: entrada.precioOfrecido
        });
      }

      // Guardar las entradas
      for (const entrada of entradasParaGuardar) {
        await this.supabaseService.createEntradaReporte(entrada);
      }

      this.showMessage('Reporte guardado exitosamente', 'success');
      this.resetForm();

    } catch (error: any) {
      console.error('Error guardando reporte:', error);
      this.showMessage(error.message || 'Error guardando reporte', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Descargar CSV
  async descargarCSV(): Promise<void> {
    if (!this.isFormValid()) {
      this.showMessage('Por favor completa todos los campos antes de descargar', 'error');
      return;
    }

    try {
      let csv = 'Vendedor,Fecha,Factura,Cliente,Producto,Cantidad,Precio Facturado,Precio Ofrecido,Diferencia,Total Descuento\n';

      this.entradas.forEach(entrada => {
        csv += `${this.reporte.vendedor_nombre},${this.reporte.fecha},${entrada.factura},"${entrada.cliente}","${entrada.producto}",${entrada.cantidad},${entrada.precioFacturado},${entrada.precioOfrecido},${entrada.diferencia},${entrada.totalDescuento}\n`;
      });

      this.downloadCSV(csv, `reporte_${this.reporte.fecha}.csv`);
      this.showMessage('CSV descargado exitosamente', 'success');

    } catch (error) {
      console.error('Error descargando CSV:', error);
      this.showMessage('Error descargando CSV', 'error');
    }
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Resetear formulario
  resetForm(): void {
    this.reporte = {
      vendedor_id: null,
      vendedor_nombre: '',
      fecha: new Date().toISOString().split('T')[0],
      observaciones: ''
    };
    this.entradas = [];
    this.limpiarNuevaTransaccion();
  }

  // Mostrar mensajes
  showMessage(message: string, type: 'success' | 'error'): void {
    this.messageService.add({
      severity: type,
      summary: type === 'success' ? 'Éxito' : 'Error',
      detail: message,
      life: 5000
    });
  }

  // Validar nueva transacción
  isNuevaTransaccionValida(): boolean {
    return !!(
      this.nuevaTransaccion.factura &&
      this.nuevaTransaccion.cliente &&
      this.nuevaTransaccion.producto &&
      this.nuevaTransaccion.cantidad > 0 &&
      this.nuevaTransaccion.precioFacturado > 0 &&
      this.nuevaTransaccion.precioOfrecido > 0
    );
  }

  // Agregar nueva transacción
  agregarTransaccion(): void {
    if (!this.isNuevaTransaccionValida()) {
      this.showMessage('Por favor completa todos los campos de la transacción', 'error');
      return;
    }

    // Calcular diferencias
    this.calcularDiferencias(this.nuevaTransaccion);

    // Agregar a la lista
    this.entradas.push({
      ...this.nuevaTransaccion,
      id: this.entradas.length + 1
    });

    // Limpiar formulario
    this.limpiarNuevaTransaccion();

    this.showMessage('Transacción agregada exitosamente', 'success');
  }

  // Limpiar formulario de nueva transacción
  limpiarNuevaTransaccion(): void {
    this.nuevaTransaccion = {
      id: 0,
      factura: '',
      cliente: '',
      producto: '',
      cantidad: 1,
      precioFacturado: 0,
      precioOfrecido: 0,
      diferencia: 0,
      totalDescuento: 0
    };
  }

  // Métodos para manejar cambios en dropdowns
  async onVendedorChange(event: any): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Solo crear si es un string, no existe en la lista y es diferente al valor anterior
    if (typeof event === 'string' && event.trim() && event.trim() !== this.lastVendedorValue) {
      this.lastVendedorValue = event.trim();
      const existe = this.vendedores.find(v => v.nombre.toLowerCase() === event.trim().toLowerCase());
      if (!existe) {
        try {
          const nuevoVendedor = await this.supabaseService.createVendedor({
            nombre: event.trim(),
            email: `${event.trim().toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
            telefono: '',
            activo: true
          });
          this.vendedores.push(nuevoVendedor);
          this.reporte.vendedor_nombre = nuevoVendedor.nombre;
          this.showMessage(`Vendedor "${event.trim()}" creado exitosamente`, 'success');
        } catch (error) {
          console.error('Error creando vendedor:', error);
          this.showMessage('Error creando vendedor', 'error');
        }
      }
    } else if (typeof event === 'object' && event) {
      // Si es un objeto (selección existente), actualizar el valor anterior
      this.lastVendedorValue = event.nombre || '';
    }
  }

  async onClienteChange(event: any): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Solo crear si es un string, no existe en la lista y es diferente al valor anterior
    if (typeof event === 'string' && event.trim() && event.trim() !== this.lastClienteValue) {
      this.lastClienteValue = event.trim();
      const existe = this.clientes.find(c => c.nombre.toLowerCase() === event.trim().toLowerCase());
      if (!existe) {
        try {
          const nuevoCliente = await this.supabaseService.createCliente({
            nombre: event.trim(),
            email: `${event.trim().toLowerCase().replace(/\s+/g, '.')}@cliente.com`,
            telefono: '',
            activo: true
          });
          this.clientes.push(nuevoCliente);
          this.nuevaTransaccion.cliente = nuevoCliente.nombre;
          this.showMessage(`Cliente "${event.trim()}" creado exitosamente`, 'success');
        } catch (error) {
          console.error('Error creando cliente:', error);
          this.showMessage('Error creando cliente', 'error');
        }
      }
    } else if (typeof event === 'object' && event) {
      // Si es un objeto (selección existente), actualizar el valor anterior
      this.lastClienteValue = event.nombre || '';
    }
  }

  async onProductoChange(event: any): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Solo crear si es un string, no existe en la lista y es diferente al valor anterior
    if (typeof event === 'string' && event.trim() && event.trim() !== this.lastProductoValue) {
      this.lastProductoValue = event.trim();
      const existe = this.productos.find(p => p.nombre.toLowerCase() === event.trim().toLowerCase());
      if (!existe) {
        try {
          const nuevoProducto = await this.supabaseService.createProducto({
            nombre: event.trim(),
            descripcion: '',
            precio_base: 0,
            activo: true
          });
          this.productos.push(nuevoProducto);
          this.nuevaTransaccion.producto = nuevoProducto.nombre;
          this.showMessage(`Producto "${event.trim()}" creado exitosamente`, 'success');
        } catch (error) {
          console.error('Error creando producto:', error);
          this.showMessage('Error creando producto', 'error');
        }
      }
    } else if (typeof event === 'object' && event) {
      // Si es un objeto (selección existente), actualizar el valor anterior
      this.lastProductoValue = event.nombre || '';
    }
  }

  // Mostrar modal de contraseña para descargar todos los reportes
  showCsvPasswordDialog(): void {
    this.csvPassword = '';
    this.showCsvPasswordModal = true;
  }

  // Descargar todos los reportes con contraseña
  async descargarTodosLosReportes(): Promise<void> {
    // Verificar si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      this.showMessage('No se puede descargar en el servidor', 'error');
      return;
    }

    if (!this.csvPassword.trim()) {
      this.showMessage('Por favor ingresa la contraseña', 'error');
      return;
    }

    if (!this.supabaseService.verifyCsvPassword(this.csvPassword)) {
      this.showMessage('Contraseña incorrecta', 'error');
      return;
    }

    try {
      this.isLoading = true;
      const csv = await this.supabaseService.generateCSVAllReportes();
      this.downloadCSV(csv, `todos_los_reportes_${new Date().toISOString().split('T')[0]}.csv`);
      this.showMessage('CSV de todos los reportes descargado exitosamente', 'success');
      this.showCsvPasswordModal = false;
    } catch (error) {
      console.error('Error descargando todos los reportes:', error);
      this.showMessage('Error descargando reportes', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Cerrar modal de contraseña
  closeCsvPasswordModal(): void {
    this.showCsvPasswordModal = false;
    this.csvPassword = '';
  }

  // Métodos para crear nuevos registros
  crearNuevoVendedor(): void {
    this.nuevoVendedorNombre = '';
    this.showVendedorModal = true;
  }

  async guardarNuevoVendedor(): Promise<void> {
    if (!this.nuevoVendedorNombre.trim()) {
      this.showMessage('Por favor ingresa el nombre del vendedor', 'error');
      return;
    }

    try {
      const nuevoVendedor = await this.supabaseService.createVendedor({
        nombre: this.nuevoVendedorNombre.trim(),
        email: `${this.nuevoVendedorNombre.trim().toLowerCase().replace(/\s+/g, '.')}@empresa.com`,
        telefono: '',
        activo: true
      });
      this.vendedores.push(nuevoVendedor);
      this.reporte.vendedor_nombre = nuevoVendedor.nombre;
      this.showVendedorModal = false;
      this.showMessage(`Vendedor "${this.nuevoVendedorNombre.trim()}" creado exitosamente`, 'success');
    } catch (error) {
      console.error('Error creando vendedor:', error);
      this.showMessage('Error creando vendedor', 'error');
    }
  }

  crearNuevoCliente(): void {
    this.nuevoClienteNombre = '';
    this.showClienteModal = true;
  }

  async guardarNuevoCliente(): Promise<void> {
    if (!this.nuevoClienteNombre.trim()) {
      this.showMessage('Por favor ingresa el nombre del cliente', 'error');
      return;
    }

    try {
      const nuevoCliente = await this.supabaseService.createCliente({
        nombre: this.nuevoClienteNombre.trim(),
        email: `${this.nuevoClienteNombre.trim().toLowerCase().replace(/\s+/g, '.')}@cliente.com`,
        telefono: '',
        activo: true
      });
      this.clientes.push(nuevoCliente);
      this.nuevaTransaccion.cliente = nuevoCliente.nombre;
      this.showClienteModal = false;
      this.showMessage(`Cliente "${this.nuevoClienteNombre.trim()}" creado exitosamente`, 'success');
    } catch (error) {
      console.error('Error creando cliente:', error);
      this.showMessage('Error creando cliente', 'error');
    }
  }

  crearNuevoProducto(): void {
    this.nuevoProductoNombre = '';
    this.showProductoModal = true;
  }

  async guardarNuevoProducto(): Promise<void> {
    if (!this.nuevoProductoNombre.trim()) {
      this.showMessage('Por favor ingresa el nombre del producto', 'error');
      return;
    }

    try {
      const nuevoProducto = await this.supabaseService.createProducto({
        nombre: this.nuevoProductoNombre.trim(),
        descripcion: '',
        precio_base: 0,
        activo: true
      });
      this.productos.push(nuevoProducto);
      this.nuevaTransaccion.producto = nuevoProducto.nombre;
      this.showProductoModal = false;
      this.showMessage(`Producto "${this.nuevoProductoNombre.trim()}" creado exitosamente`, 'success');
    } catch (error) {
      console.error('Error creando producto:', error);
      this.showMessage('Error creando producto', 'error');
    }
  }
}

