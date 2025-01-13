import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeDexComponent } from './home-dex.component';

describe('HomeDexComponent', () => {
  let component: HomeDexComponent;
  let fixture: ComponentFixture<HomeDexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeDexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeDexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
