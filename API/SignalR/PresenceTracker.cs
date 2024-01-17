using System.Collections.Generic;
namespace API.SignalR
{
      public class PresenceTracker
      {
            public class ConnPeer
            {
                  public List<string> ConnectionIds { get; }
                  public List<string> PeerIds { get; }

                  public ConnPeer(List<string> connectionIds, List<string> peerIds)
                  {
                        ConnectionIds = connectionIds;
                        PeerIds = peerIds;
                  }
            }

            private static readonly Dictionary<string, ConnPeer> OnlineUsers = new Dictionary<string, ConnPeer>();

            public Task<bool> UserConnected(string username, string connectionId, string peerId = "")
            {
                  bool isOnline = false;
                  lock (OnlineUsers)
                  {
                        if (OnlineUsers.ContainsKey(username))
                        {
                              OnlineUsers[username].ConnectionIds.Add(connectionId);
                              OnlineUsers[username].PeerIds.Add(peerId);
                        }
                        else
                        {
                              OnlineUsers.Add(username, new ConnPeer(new List<string> { connectionId }, new List<string> { peerId }));
                              isOnline = true;
                        }

                        Console.WriteLine( OnlineUsers[username].ConnectionIds);
                  }

                  return Task.FromResult(isOnline);
            }

            public Task<bool> UserDisconnected(string username, string connectionId, string peerId = "")
            {
                  bool isOffline = false;

                  lock (OnlineUsers)
                  {
                        if (!OnlineUsers.ContainsKey(username)) return Task.FromResult(isOffline);

                        var connPeer = OnlineUsers[username];
                        connPeer.ConnectionIds.Remove(connectionId);
                        connPeer.PeerIds.Remove(peerId);

                        if (connPeer.ConnectionIds.Count == 0 && connPeer.PeerIds.Count == 0)
                        {
                              OnlineUsers.Remove(username);
                              isOffline = true;
                        }
                  }

                  return Task.FromResult(isOffline);
            }


            public Task<string[]> GetOnlineUsers()
            {
                  string[] onlineUsers;
                  lock (OnlineUsers)
                  {
                        onlineUsers = OnlineUsers.OrderBy(k => k.Key).Select(k => k.Key).ToArray();
                  }

                  return Task.FromResult(onlineUsers);
            }

            public static Task<List<string>> GetConnectionForUser(string username)
            {
                  List<string> connectionIds;

                  lock (OnlineUsers)
                  {
                        if (OnlineUsers.TryGetValue(username, out var connPeer))
                        {
                              connectionIds = connPeer.ConnectionIds;
                        }
                        else
                        {
                              connectionIds = new List<string>();
                        }
                  }

                  return Task.FromResult(connectionIds);
            }

            public static Task<List<string>> GetPeerForUser(string username)
            {
                  List<string> peerIds;

                  lock (OnlineUsers)
                  {
                        if (OnlineUsers.TryGetValue(username, out var connPeer))
                        {
                              peerIds = connPeer.PeerIds;
                        }
                        else
                        {
                              peerIds = new List<string>();
                        }
                  }

                  return Task.FromResult(peerIds);
            }
      }


}