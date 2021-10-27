import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkyBoxComponent } from './sky-box.component';

describe('SkyBoxComponent', () => {
  let component: SkyBoxComponent;
  let fixture: ComponentFixture<SkyBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SkyBoxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkyBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
