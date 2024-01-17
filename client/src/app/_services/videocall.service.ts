import { Injectable } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';

@Injectable({
      providedIn: 'root'
})
export class VideocallService {
      private hubConnection?: HubConnection;
      constructor() { }
      

}
