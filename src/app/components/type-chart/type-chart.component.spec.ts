import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeChartComponent } from './type-chart.component';

describe('TypeChartComponent', () => {
  let component: TypeChartComponent;
  let fixture: ComponentFixture<TypeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
