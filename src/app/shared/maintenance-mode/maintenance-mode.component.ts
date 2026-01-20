import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceService } from '../../services/maintenance.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-maintenance-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-mode.component.html',
  styleUrls: ['./maintenance-mode.component.css']
})
export class MaintenanceModeComponent implements OnInit, OnDestroy {
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
