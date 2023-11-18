import { Component, OnInit } from '@angular/core';
import { AccountService } from '../_services/account.service';
import { Observable, of, subscribeOn } from 'rxjs';
import { User } from '../_models/user';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
      selector: 'app-nav',
      templateUrl: './nav.component.html',
      styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
      model: any = {};
      isNavbarOpen = false;

      constructor(public accountServices: AccountService, private router: Router, private tostr: ToastrService) { }

      ngOnInit(): void {
      }
      toggleNavbar() {
            this.isNavbarOpen = !this.isNavbarOpen;
          }

      login() {
            this.accountServices.login(this.model).subscribe({
                  next: () => {
                        this.router.navigateByUrl('/members');
                        this.model = {};
                  }
            })
      }
      logout() {
            this.accountServices.logout();
            this.router.navigateByUrl('/')

      }
      
}
