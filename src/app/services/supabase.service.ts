import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaces para la base de datos
export interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  activo: boolean;
  created_by?: string;
  created_at: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  activo: boolean;
  created_at: string;
}

export interface Reporte {
  id: number;
  vendedor_id: number;
  fecha: string;
  observaciones?: string;
  created_at: string;
  vendedor?: Vendedor;
}

export interface EntradaReporte {
  id: number;
  reporte_id: number;
  factura: string;
  cliente_id: number;
  producto_id: number;
  cantidad: number;
  precio_facturado: number;
  precio_ofrecido: number;
  diferencia: number;
  total_descuento: number;
  created_at: string;
  cliente?: Cliente;
  producto?: Producto;
}

// Interfaz para crear entradas (sin campos calculados)
export interface CreateEntradaReporte {
  reporte_id: number;
  factura: string;
  cliente_id: number;
  producto_id: number;
  cantidad: number;
  precio_facturado: number;
  precio_ofrecido: number;
}

// Configuración de Supabase (CAMBIAR POR TUS CREDENCIALES)
const SUPABASE_URL = 'https://mgxgsfkespclwluhyipy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neGdzZmtlc3BjbHdsdWh5aXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTIyMjIsImV4cCI6MjA2NjcyODIyMn0.0tTAeEWkH1rMk6865StYJXBlodjcXpmw5Sfb0ywtG4w';

// Contraseña hardcodeada para descargar CSV
// CAMBIAR ESTA CONTRASEÑA POR LA QUE DESEES USAR
const CSV_PASSWORD = 'Diaz2024!';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient | null = null;
  private reportesSubject = new BehaviorSubject<Reporte[]>([]);
  private entradasSubject = new BehaviorSubject<EntradaReporte[]>([]);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Solo crear el cliente de Supabase en el navegador
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client creado correctamente');
      } catch (error) {
        console.error('❌ Error creando Supabase client:', error);
        throw error;
      }
    } else {
      console.log('🔄 Supabase client no creado en el servidor');
    }
  }

  // Método para verificar si el cliente está disponible
  private isClientAvailable(): boolean {
    return this.supabase !== null && isPlatformBrowser(this.platformId);
  }

  // Método para verificar contraseña de CSV
  verifyCsvPassword(password: string): boolean {
    return password === CSV_PASSWORD;
  }

  // Método para probar la conexión
  async testConnection(): Promise<boolean> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    try {
      const { error } = await this.supabase!
        .from('vendedores')
        .select('id')
        .limit(1);
      if (error) {
        throw new Error('Error de conexión con Supabase: ' + error.message);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Métodos para Vendedores
  async getVendedores(): Promise<Vendedor[]> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('vendedores')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createVendedor(vendedor: Omit<Vendedor, 'id' | 'created_at'>): Promise<Vendedor> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('vendedores')
      .insert([vendedor])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVendedor(id: number): Promise<void> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { error } = await this.supabase!
      .from('vendedores')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }

  // Métodos para Clientes
  async getClientes(): Promise<Cliente[]> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('clientes')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createCliente(cliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('clientes')
      .insert([cliente])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Métodos para Productos
  async getProductos(): Promise<Producto[]> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;
    return data || [];
  }

  async createProducto(producto: Omit<Producto, 'id' | 'created_at'>): Promise<Producto> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('productos')
      .insert([producto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Métodos para Reportes
  async getReportes(): Promise<Reporte[]> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('reportes')
      .select(`
        *,
        vendedor:vendedores(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createReporte(reporte: Omit<Reporte, 'id' | 'created_at'>): Promise<Reporte> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('reportes')
      .insert([reporte])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Métodos para Entradas de Reporte
  async getEntradasByReporte(reporteId: number): Promise<EntradaReporte[]> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('entradas_reporte')
      .select(`
        *,
        cliente:clientes(*),
        producto:productos(*)
      `)
      .eq('reporte_id', reporteId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async createEntradaReporte(entrada: CreateEntradaReporte): Promise<EntradaReporte> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const { data, error } = await this.supabase!
      .from('entradas_reporte')
      .insert([entrada])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Método para crear reporte completo con entradas
  async createReporteCompleto(
    reporte: Omit<Reporte, 'id' | 'created_at'>,
    entradas: CreateEntradaReporte[]
  ): Promise<{ reporte: Reporte; entradas: EntradaReporte[] }> {
    // Crear el reporte
    const reporteCreado = await this.createReporte(reporte);

    // Crear las entradas asociadas al reporte
    const entradasConReporteId = entradas.map(entrada => ({
      ...entrada,
      reporte_id: reporteCreado.id
    }));

    const entradasCreadas: EntradaReporte[] = [];
    for (const entrada of entradasConReporteId) {
      const entradaCreada = await this.createEntradaReporte(entrada);
      entradasCreadas.push(entradaCreada);
    }

    return { reporte: reporteCreado, entradas: entradasCreadas };
  }

  // Método para obtener reporte completo con entradas
  async getReporteCompleto(reporteId: number): Promise<{ reporte: Reporte; entradas: EntradaReporte[] }> {
    if (!this.isClientAvailable()) {
      throw new Error('Supabase client no disponible');
    }

    const reporte = await this.supabase!
      .from('reportes')
      .select(`
        *,
        vendedor:vendedores(*)
      `)
      .eq('id', reporteId)
      .single();

    const entradas = await this.getEntradasByReporte(reporteId);

    return { reporte: reporte.data, entradas };
  }

  // Método para generar CSV de reporte
  async generateCSVForReporte(reporteId: number): Promise<string> {
    const { reporte, entradas } = await this.getReporteCompleto(reporteId);

    let csv = 'Vendedor,Fecha,Factura,Cliente,Producto,Cantidad,Precio Facturado,Precio Ofrecido,Diferencia,Total Descuento\n';

    entradas.forEach(entrada => {
      csv += `${reporte.vendedor?.nombre || 'N/A'},${reporte.fecha},${entrada.factura},"${entrada.cliente?.nombre || 'N/A'}","${entrada.producto?.nombre || 'N/A'}",${entrada.cantidad},${entrada.precio_facturado},${entrada.precio_ofrecido},${entrada.diferencia},${entrada.total_descuento}\n`;
    });

    return csv;
  }

  // Método para generar CSV de todos los reportes
  async generateCSVAllReportes(): Promise<string> {
    const reportes = await this.getReportes();

    let csv = 'ID Reporte,Vendedor,Fecha,Factura,Cliente,Producto,Cantidad,Precio Facturado,Precio Ofrecido,Diferencia,Total Descuento\n';

    for (const reporte of reportes) {
      const entradas = await this.getEntradasByReporte(reporte.id);

      entradas.forEach(entrada => {
        csv += `${reporte.id},${reporte.vendedor?.nombre || 'N/A'},${reporte.fecha},${entrada.factura},"${entrada.cliente?.nombre || 'N/A'}","${entrada.producto?.nombre || 'N/A'}",${entrada.cantidad},${entrada.precio_facturado},${entrada.precio_ofrecido},${entrada.diferencia},${entrada.total_descuento}\n`;
      });
    }

    return csv;
  }

  // Observables para reactividad
  get reportes$(): Observable<Reporte[]> {
    return this.reportesSubject.asObservable();
  }

  get entradas$(): Observable<EntradaReporte[]> {
    return this.entradasSubject.asObservable();
  }

  // Método para actualizar observables
  async refreshReportes(): Promise<void> {
    const reportes = await this.getReportes();
    this.reportesSubject.next(reportes);
  }
}
