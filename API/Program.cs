using API.Data;
using API.Entities;
using API.Extensions;
using API.Middleware;
using API.SignalR;
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
      // Use connection string provided at runtime by render.
      var connUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

      // Parse the PostgreSQL URL
      connUrl = connUrl.Replace("postgres://", string.Empty);
      var pgUserPass = connUrl.Split("@")[0];
      var pgHostDb = connUrl.Split("@")[1];
      var pgHost = pgHostDb.Split("/")[0];
      var pgDb = pgHostDb.Split("/")[1];
      var pgUser = pgUserPass.Split(":")[0];
      var pgPass = pgUserPass.Split(":")[1];
      var pgPort = "5432";

      connString = $"Server={pgHost};Port={pgPort};User Id={pgUser};Password={pgPass};Database={pgDb};";

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
