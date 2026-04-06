import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserState } from './service/state/user_state/user-state';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('test1');
  private userState = inject(UserState);

  ngOnInit(): void {
    this.userState.loadUser().subscribe();
  }
}
