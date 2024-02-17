import { Component, OnInit } from '@angular/core';
import { AccountService } from './_services/account.service';
import { User } from './_models/user';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'Dating App';
  users: any;

  constructor(private accountService: AccountService,private router: Router){}

  ngOnInit(): void {
     
     this.setCurrentUser();
     if(this.router.url === environment.baseUrl){
      this.router.navigateByUrl('/members');
     }
  }

 
  setCurrentUser(){
      const userString = localStorage.getItem('user');
      if(!userString) return;
      const user: User = JSON.parse(userString);
      this.accountService.setCurrentUser(user);
  }
}
