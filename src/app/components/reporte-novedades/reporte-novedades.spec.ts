import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteNovedades } from './reporte-novedades';

describe('ReporteNovedades', () => {
  let component: ReporteNovedades;
  let fixture: ComponentFixture<ReporteNovedades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteNovedades]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteNovedades);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
