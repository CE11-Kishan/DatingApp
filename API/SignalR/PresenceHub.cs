using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{
      [Authorize]
      public class PresenceHub : Hub
      {
            private readonly PresenceTracker _tracker;
            private readonly IUnitOfWork _uow;

            public PresenceHub(PresenceTracker tracker, IUnitOfWork uow)
            {
                  _tracker = tracker;
                  _uow = uow;
            }


            public override async Task OnConnectedAsync()
            {
                  var isOnline = await _tracker.UserConnected(Context.User.GetUserName(), Context.ConnectionId);

                  if (isOnline)
                        await Clients.Others.SendAsync("UserIsOnline", Context.User.GetUserName());

                  var currentUsers = await _tracker.GetOnlineUsers();
                  await Clients.Caller.SendAsync("GetOnlineUsers", currentUsers);
            }

            public override async Task OnDisconnectedAsync(Exception exception)
            {
                  var isOffline = await _tracker.UserDisconnected(Context.User.GetUserName(), Context.ConnectionId);

                  if (isOffline)
                        await Clients.Others.SendAsync("UserIsOffline", Context.User.GetUserName());

                  await base.OnDisconnectedAsync(exception);
            }

            public async Task VideoCallUser(string recipientUser)
            {
                  var username = Context.User.GetUserName();
                  var sender = await _uow.UserRepository.GetUserByUsernameAsync(username);
                  var recipient = await _uow.UserRepository.GetUserByUsernameAsync(recipientUser);
                  var connections = await PresenceTracker.GetConnectionForUser(recipient.UserName);

                  if (connections != null)
                  {
                        await Clients.Clients(connections).SendAsync("AcceptVideoCall",
                              new { username = sender.UserName, knownAs = sender.KnownAs });
                  }
            }
      }
}