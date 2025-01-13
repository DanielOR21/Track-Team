import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveDexComponent } from './move-dex.component';

describe('MoveDexComponent', () => {
  let component: MoveDexComponent;
  let fixture: ComponentFixture<MoveDexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveDexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveDexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
