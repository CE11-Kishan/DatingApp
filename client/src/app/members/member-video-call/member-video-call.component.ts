import { Component, OnInit, ViewChild, ElementRef, Input, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
      mediaConnection: any;
      localStream : MediaStream | undefined = undefined;
      memberName: string = '';

      constructor(private route: ActivatedRoute, 
            private accountService: AccountService,
            public presenceService: PresenceService,
            private elementRef: ElementRef,
            private cdr: ChangeDetectorRef) {
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
                              this.scrollToBottom();
                        }
                  }
            });

            if(this.callBtnText === 'Call'){
                  this.memberName = this.member.knownAs;
            }else{
                  this.memberName = '';
            }

            this.loadCallBackgroundImage();
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
            this.callBtnText = "Connecting";
            this.peer = new Peer(this.member.userName);
            console.log(this.member.userName);

            this.presenceService.callUser(this.member.userName);

            this.peer.on('open', (id) => {
                  console.log("Peer Room ID: ", id)
                  this.callBtnText = "End Call";
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
                        this.localStream = stream;
                        this.streamLocalVideo(stream);
                        this.peer!.on('call', (call) => {
                              this.mediaConnection = call;
                              call.answer(stream);
                              call.on('stream', (stream) => {
                                  console.log("got call");
                                  console.log(stream);
                                  this.streamRemoteVideo(stream);
                                  this.callBtnText = "End Call";
                                  this.memberName = ' with ' + this.member.knownAs;
                                  this.cdr.detectChanges();
                              });
                              call.on('close', () =>{
                                    this.streamLocalVideo(null);
                                    this.streamRemoteVideo(null);
                                    this.callBtnText = "Call";
                                    this.memberName = this.member.knownAs;
                                    this.cdr.detectChanges();
                              });
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
                        this.localStream = stream;
                        this.streamLocalVideo(stream);
                        this.mediaConnection = this.peer!.call(this.user!.username, stream);
                        this.mediaConnection.on('stream', (stream: any) =>{
                              this.streamRemoteVideo(stream);
                              this.callBtnText = "End Call";
                              this.memberName = ' with ' + this.member.knownAs;
                              this.cdr.detectChanges();
                        });
                        this.mediaConnection.on('close', () =>{
                              this.streamLocalVideo(null);
                              this.streamRemoteVideo(null);
                              this.callBtnText = "Call";
                              this.memberName = this.member.knownAs;
                              this.cdr.detectChanges();
                        });
                        }, (err) => {
                        console.log(err)
                  })
            });
      }

      private endCall(){
            this.mediaConnection.close();
      }


      private streamRemoteVideo(stream: any): void {
            this.remoteVideo.nativeElement.srcObject = stream;
            this.cdr.detectChanges();
      }
      
      private streamLocalVideo(stream: any): void {
            this.localVideo.nativeElement.srcObject = stream;
            if (this.localStream && stream === null) {
                  this.localStream.getTracks().forEach(track => track.stop());

            }
            this.cdr.detectChanges();
      }

      private loadCallBackgroundImage(): void{
            const localVideoAreaElement = this.elementRef.nativeElement.querySelector('.caller');
            localVideoAreaElement.style.backgroundImage = `url(${this.member.photoUrl})`;

            const remoteVideoAreaElement = this.elementRef.nativeElement.querySelector('.receiver');
            remoteVideoAreaElement.style.backgroundImage = `url(${this.user?.photoUrl})`;
      }

      private scrollToBottom(): void {
            window.scrollTo({
                  left: 0,
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
            });

      }
}