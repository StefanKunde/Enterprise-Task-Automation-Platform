import { Component, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const line = document.getElementById('growing-line');
    const arrow = document.getElementById('flying-arrow');
    const coins = document.getElementById('coin-explosion');

    if (!line || !arrow || !coins) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          line.classList.add('animate-line');
          arrow.classList.add('animate-arrow');
          arrow.classList.remove('opacity-0');
          coins.classList.add('animate-coins');
          coins.classList.remove('opacity-0');
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(line);
  }
}
