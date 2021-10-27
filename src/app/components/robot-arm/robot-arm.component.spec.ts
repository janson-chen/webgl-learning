import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RobotArmComponent } from './robot-arm.component';

describe('RobotArmComponent', () => {
  let component: RobotArmComponent;
  let fixture: ComponentFixture<RobotArmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RobotArmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotArmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
