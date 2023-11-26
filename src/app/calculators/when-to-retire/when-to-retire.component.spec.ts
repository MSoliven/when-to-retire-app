import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhenToRetireComponent } from './when-to-retire.component';

describe('WhenToRetireComponent', () => {
  let component: WhenToRetireComponent;
  let fixture: ComponentFixture<WhenToRetireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WhenToRetireComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhenToRetireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
