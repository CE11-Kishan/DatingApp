import { Component, OnInit, ViewChild, ElementRef, Input, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Peer from 'peerjs';
import { take } from 'rxjs';
import { Member } from 'src/app/_models/member';
import { PresenceService } from 'src/app/_services/presence.service';
import { VideocallService } from 'src/app/_services/videocall.service';

@Component({
      selector: 'app-member-video-call',
      templateUrl: './member-video-call.component.html',
      styleUrls: ['./member-video-call.component.css']
})
export class MemberVideoCallComponent implements OnInit {
      @ViewChild('callerVideo') callerVideo!: ElementRef<HTMLVideoElement>;
      @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;
      localStream: MediaStream | undefined;
      private peer: Peer;
      @Input()
      peerIdShare: string[] = [];
      peerId: string = '';
      private lazyStream: any;
      currentPeer: any;
      private peerList: Array<any> = [];
      @Input() username?: string;
      loading = false;
      public isOnline: boolean = false;
      member: Member = {} as Member;
      connectMessage = 'User is Online';
      notify = false;


      constructor(private route: ActivatedRoute, private elementRef: ElementRef, private videoCallService: VideocallService, public presenceService: PresenceService, private router: Router) {
            this.peer = this.presenceService.peer;
            this.presenceService.onlineUsers$.pipe(take(1)).subscribe({
                  next: users => {
                        if (this.member.userName in users) {
                              this.isOnline = true;
                              console.log(this.isOnline);
                        }
                  }
            });

            console.log(this.isOnline);
      }
      ngOnDestroy() {
            this.router.navigateByUrl('/members/' + this.username);
      }
      ngOnInit(): void {
            //this.loadUserPeerId(); 
            this.route.data.subscribe({
                  next: data => this.member = data['member']
            });


            this.route.queryParams.subscribe({
                  next: params => {
                        this.notify = true;
                        if (params['tab']) {
                              console.log('helooooooooooo');
                              this.callPeer(this.peerIdShare[0]);
                              this.getPeerVideo();
                              this.loadMyVideo();
                              console.log('byeeeeeeeeeeee');
                        }
                  }
            });
      }

      //  @HostListener('window:beforeunload', ['$event'])
      // beforeUnloadHandler(event: Event): string {
      //   this.router.navigateByUrl('/members/' + this.username);
      //   return 'Are you sure you want to leave?';
      // }

      getConnectionMessage(): string {
            return this.isOnline ? 'Ringing' : 'User is offline';
      }

      public loadUserPeerId() {
            if (this.username) {
                  this.presenceService.getPeerId(this.username)?.then(peerIdList => {

                        this.peerIdShare = peerIdList === undefined ? [] : peerIdList;
                        console.log(peerIdList);
                        if (this.peerIdShare.length === 0)
                              this.isOnline = false;
                        else
                              this.isOnline = true;

                        console.log(this.connectMessage);
                  });
            }

      }



      private getPeerVideo = () => {
            //console.log('getPeerVideo CALLED OF MEMBER.VIDEO.CALL.COMPONENT')
            this.peer.on('call', (call) => {
                  navigator.mediaDevices.getUserMedia({
                        video: {
                              frameRate: { ideal: 120 }, // Desired frame rate
                              // Add other constraints if needed, such as facingMode, aspectRatio, etc.
                        },
                        audio: true
                  }).then((stream) => {
                        this.lazyStream = stream;

                        call.answer(stream);
                        call.on('stream', (remoteStream) => {
                              if (!this.peerList.includes(call.peer)) {
                                    this.streamRemoteVideo(remoteStream);
                                    this.currentPeer = call.peerConnection;
                                    this.peerList.push(call.peer);
                              }
                        });
                        this.loading = false
                  }).catch(err => {
                        console.log(err + ' Unable to get media');
                  });
            });
      }

      connectWithPeer(): void {
            if (this.username) {
                  this.presenceService.callUser(this.username);
            }


            this.callPeer(this.peerIdShare[0]);
            this.getPeerVideo();
            this.loadMyVideo();
      }

      private callPeer(id: string): void {
            navigator.mediaDevices.getUserMedia({
                  video: {
                        frameRate: { ideal: 120 },
                  },
                  audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                  }
            }).then((stream) => {
                  this.lazyStream = stream;

                  const call = this.peer.call(id, stream);
                  call.on('stream', (remoteStream) => {
                        if (!this.peerList.includes(call.peer)) {
                              this.streamRemoteVideo(remoteStream);
                              this.currentPeer = call.peerConnection;
                              this.peerList.push(call.peer);
                        }
                  });
            }).catch(err => {
                  console.log(err + ' Unable to connect');
            });
      }

      private streamRemoteVideo(stream: any): void {
            this.remoteVideo.nativeElement.srcObject = stream;
      }

      public async loadMyVideo(): Promise<void> {
            try {
                  this.localStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                              frameRate: { ideal: 120 },
                        },
                        audio: {
                              echoCancellation: true,
                              noiseSuppression: true
                        }
                  });
                  if (this.localStream && this.callerVideo) {
                        this.callerVideo.nativeElement.srcObject = this.localStream;
                        this.callerVideo.nativeElement.onloadedmetadata = () => {
                              this.callerVideo.nativeElement.play();
                        };
                  }
            } catch (error) {
                  console.error('Error accessing the camera: ', error);
            }
      }


      // screenShare(): void {
      //       this.shareScreen();
      // }

      // private shareScreen(): void {
      //       navigator.mediaDevices.getDisplayMedia({
      //             video: {
      //                   frameRate: { ideal: 60 },
      //             },
      //             audio: {
      //                   echoCancellation: true,
      //                   noiseSuppression: true
      //             }
      //       }).then(stream => {
      //             const videoTrack = stream.getVideoTracks()[0];
      //             videoTrack.onended = () => {
      //                   this.stopScreenShare();
      //             };

      //             const sender = this.currentPeer.getSenders().find((s: any) => s.track.kind === videoTrack.kind);
      //             sender.replaceTrack(videoTrack);
      //       }).catch(err => {
      //             console.log('Unable to get display media ' + err);
      //       });
      // }

      // private stopScreenShare(): void {
      //       const videoTrack = this.lazyStream.getVideoTracks()[0];
      //       const sender = this.currentPeer.getSenders().find((s: any) => s.track.kind === videoTrack.kind);
      //       sender.replaceTrack(videoTrack);
      // }
}
