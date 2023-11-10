using API.Data;
using API.Entities;
using API.Extensions;
using API.Middleware;
using API.SignalR;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddApplicationService(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);

var connString = "";
if (builder.Environment.IsDevelopment())
      connString = builder.Configuration.GetConnectionString("DefaultConnection");
else
{
      // Use connection string provided at runtime by Heroku.
      var postgresUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

      // Parse connection URL to connection string for Npgsql
      Uri uri = new Uri(postgresUrl);

        string[] userInfo = uri.UserInfo.Split(':');
        string username = Uri.UnescapeDataString(userInfo[0]);
        string password = Uri.UnescapeDataString(userInfo[1]);

        string host = uri.Host;
        int port = uri.Port == -1 ? 5432 : uri.Port;

        string[] pathSegments = uri.Segments;
        string database = pathSegments[pathSegments.Length - 1].Trim('/');

        // Construct the connection string
        connString = $"Host={host};Port={port};Username={username};Password={password};Database={database};";

}
builder.Services.AddDbContext<DataContext>(opt =>
{
      opt.UseNpgsql(connString);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();
if (app.Environment.IsDevelopment())
{
      app.UseSwagger();
      app.UseSwaggerUI();
}

app.UseHttpsRedirection();

//app.UseAuthorization();

app.UseCors(builder => builder.AllowAnyHeader()
      .AllowAnyMethod().AllowCredentials().WithOrigins("https://localhost:4200"));

app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<PresenceHub>("hubs/presence");
app.MapHub<MessageHub>("hubs/message");
app.MapFallbackToController("Index", "Fallback");


using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
      var context = services.GetRequiredService<DataContext>();
      var userManager = services.GetRequiredService<UserManager<AppUser>>();
      var roleManager = services.GetRequiredService<RoleManager<AppRole>>();
      await context.Database.MigrateAsync();
      await Seed.ClearConnections(context);
      await Seed.SeedUser(userManager, roleManager);
}
catch (Exception ex)
{
      var logger = services.GetRequiredService<ILogger<Program>>();
      logger.LogError(ex, "An error occurred while migrating");
}

app.Run();
