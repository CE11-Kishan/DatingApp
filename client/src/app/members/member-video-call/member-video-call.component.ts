import { Component, OnInit, ViewChild, ElementRef, Input, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Peer from 'peerjs';
import { Subscription, take } from 'rxjs';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { PresenceService } from 'src/app/_services/presence.service';

@Component({
      selector: 'app-member-video-call',
      templateUrl: './member-video-call.component.html',
      styleUrls: ['./member-video-call.component.css'],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberVideoCallComponent implements OnInit {
      @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
      @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
      member: Member = {} as Member;
      peer: Peer | undefined  ;
      user: User | null = null;
      isOnline: boolean = false;
      callBtnText: string;

      constructor(private route: ActivatedRoute, 
            private accountService: AccountService,
            public presenceService: PresenceService,
            private router: Router) {
                  this.callBtnText = "Call";
                  this.accountService.currentUser$.pipe(take(1)).subscribe({
                        next: user => this.user = user
                  });
      }

      ngOnInit(): void {
            this.route.data.pipe(take(1)).subscribe({
                  next: data => {
                        this.member = data['member'];
                  }
            });

            this.presenceService.onlineUsers$.pipe(take(1)).subscribe({
                  next: users => {
                        if (this.member.userName in users) {
                              this.isOnline = true;
                        }
                  }
            });   

            this.route.queryParams.pipe(take(1)).subscribe({
                  next: params => {
                        if (params['tab']) {
                              this.callBtnText = "Accept Call";
                        }
                  }
            });
      }

      ngOnDestroy() {
            this.isOnline = false;
      }

      callButtonClicked(): void{
            switch(this.callBtnText){
                  case "Call":
                        this.makeCall();
                        break;
                  case "Accept Call":
                        this.acceptCall();
                        break;
                  case "End Call":
                        this.endCall();
                        break;
                  default:
                        break;
            }
      }

      private makeCall(){
            this.callBtnText = "Ringing";
            this.peer = new Peer(this.member.userName);
            console.log(this.member.userName);

            this.presenceService.callUser(this.member.userName);

            this.peer.on('open', (id) => {
                  console.log("Peer Room ID: ", id)
                  navigator.mediaDevices.getUserMedia({
                        video: {
                              frameRate: { ideal: 120 },
                              facingMode: 'user'
                        },
                        audio: {
                              echoCancellation: true,
                              noiseSuppression: true
                        }
                  }).
                  then((stream) => {
                        this.streamLocalVideo(stream);
                        this.callBtnText = "End Call";
                        this.peer!.on('call', (call) => {
                              call.answer(stream);
                              call.on('stream', (stream) => {
                                  console.log("got call");
                                  console.log(stream);
                                  this.streamRemoteVideo(stream);
                              })
                          })
                        }, (err) => {
                        console.log(err)
                  })
            })
      }

      private acceptCall(){
            this.callBtnText = "Connecting"
            this.peer = new Peer();
            this.peer.on('open', (id) => {
                  navigator.mediaDevices.getUserMedia({
                        video: {
                              frameRate: { ideal: 120 },
                              facingMode: 'user'
                        },
                        audio: {
                              echoCancellation: true,
                              noiseSuppression: true
                        }
                  }).
                  then((stream) => {
                        this.streamLocalVideo(stream);
                        this.callBtnText = "End Call";
                        const call = this.peer!.call(this.user!.username, stream);
                        call.on('stream', (stream) =>{
                              this.streamRemoteVideo(stream);
                        })
                        }, (err) => {
                        console.log(err)
                  })
            });
      }

      private endCall(){

      }


      private streamRemoteVideo(stream: any): void {
            this.remoteVideo.nativeElement.srcObject = stream;
      }

      private streamLocalVideo(stream: any): void {
            this.localVideo.nativeElement.srcObject = stream;
      }
}