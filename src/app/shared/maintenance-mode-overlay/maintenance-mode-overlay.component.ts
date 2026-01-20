import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceService } from '../../services/maintenance.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-maintenance-mode-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-mode-overlay.component.html',
  styleUrls: ['./maintenance-mode-overlay.component.css']
})
export class MaintenanceModeOverlayComponent implements OnInit, OnDestroy {
  isInMaintenance = false;
  maintenanceMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private maintenanceService: MaintenanceService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.maintenanceService.getMaintenanceModeObservable().subscribe(
        isInMaintenance => this.isInMaintenance = isInMaintenance
      )
    );

    this.subscriptions.push(
      this.maintenanceService.getMaintenanceMessageObservable().subscribe(
        message => this.maintenanceMessage = message
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
