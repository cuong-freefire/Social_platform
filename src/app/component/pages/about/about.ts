import { Component } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [Navbar, CommonModule, ButtonModule, CardModule, TooltipModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  showGAY = false;
  showContact = false;

  features = [
    {
      icon: 'pi pi-bolt',
      title: 'Tốc độ',
      desc: 'Trải nghiệm nhắn tin tức thời với độ trễ cực thấp.'
    },
    {
      icon: 'pi pi-shield',
      title: 'Bảo mật',
      desc: 'Dữ liệu của bạn được bảo vệ an toàn tuyệt đối.'
    },
    {
      icon: 'pi pi-palette',
      title: 'Giao diện',
      desc: 'Thiết kế hiện đại, tinh tế và dễ dàng tùy chỉnh.'
    },
    {
      icon: 'pi pi-users',
      title: 'Cộng đồng',
      desc: 'Kết nối hàng triệu người dùng trên khắp thế giới.'
    }
  ];

  stats = [
    { label: 'Người dùng', value: '1M+' },
    { label: 'Tin nhắn/ngày', value: '50M+' },
    { label: 'Quốc gia', value: '120+' },
    { label: 'Đánh giá', value: '4.9/5' }
  ];
}
