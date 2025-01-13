import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbilityDexComponent } from './ability-dex.component';

describe('AbilityDexComponent', () => {
  let component: AbilityDexComponent;
  let fixture: ComponentFixture<AbilityDexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbilityDexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbilityDexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
