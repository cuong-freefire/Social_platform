import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css'
})
export class AboutPage {}
