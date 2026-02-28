using CoffeeShop.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CoffeeShop.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Admin> Admins { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductAttribute> ProductAttributes { get; set; }
    public DbSet<ProductBatch> ProductBatches { get; set; }
    public DbSet<SiteSetting> SiteSettings { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Testimonial> Testimonials { get; set; }
    public DbSet<Store> Stores { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Admin>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => a.Email).IsUnique();
            e.Property(a => a.Email).HasMaxLength(256);
            e.Property(a => a.Name).HasMaxLength(100);
            e.Property(a => a.Role).HasMaxLength(50);
        });

        modelBuilder.Entity<SiteSetting>(e =>
        {
            e.HasKey(s => s.Key);
            e.Property(s => s.Key).HasMaxLength(100);
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(100);
            e.Property(c => c.Code).HasMaxLength(50);
            e.HasMany(c => c.SubCategories)
             .WithOne()
             .HasForeignKey(c => c.ParentId)
             .IsRequired(false);
            e.HasMany(c => c.Products)
             .WithOne(p => p.Category)
             .HasForeignKey(p => p.CategoryId);
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Sku).IsUnique();
            e.Property(p => p.Sku).HasMaxLength(100);
            e.Property(p => p.Name).HasMaxLength(256);
            e.Property(p => p.Unit).HasMaxLength(20);
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.Property(p => p.Cost).HasPrecision(18, 2);
        });

        modelBuilder.Entity<ProductAttribute>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasOne(a => a.Product)
             .WithMany(p => p.Attributes)
             .HasForeignKey(a => a.ProductId);
        });

        modelBuilder.Entity<ProductBatch>(e =>
        {
            e.HasKey(b => b.Id);
            e.Property(b => b.Cost).HasPrecision(18, 2);
            e.Property(b => b.DiscountPercentage).HasPrecision(5, 2);
            e.HasOne(b => b.Product)
             .WithMany(p => p.Batches)
             .HasForeignKey(b => b.ProductId);
        });

        modelBuilder.Entity<Customer>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Email).IsUnique();
            e.Property(c => c.Email).HasMaxLength(256);
            e.Property(c => c.Name).HasMaxLength(100);
            e.Property(c => c.CustomerNumber).HasMaxLength(50);
            e.Property(c => c.Phone).HasMaxLength(50);
            e.HasMany(c => c.Orders)
             .WithOne(o => o.Customer)
             .HasForeignKey(o => o.CustomerId);
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.Property(o => o.OrderNumber).HasMaxLength(50);
            e.Property(o => o.RecipientName).HasMaxLength(100);
            e.Property(o => o.RecipientPhone).HasMaxLength(50);
            e.Property(o => o.TransferCode).HasMaxLength(20);
            e.Property(o => o.Subtotal).HasPrecision(18, 2);
            e.Property(o => o.ShippingFee).HasPrecision(18, 2);
            e.Property(o => o.DiscountAmount).HasPrecision(18, 2);
            e.Property(o => o.TotalAmount).HasPrecision(18, 2);
            e.HasMany(o => o.Items)
             .WithOne(i => i.Order)
             .HasForeignKey(i => i.OrderId);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.ProductName).HasMaxLength(256);
            e.Property(i => i.ProductSku).HasMaxLength(100);
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Property(i => i.DiscountAmount).HasPrecision(18, 2);
            e.Property(i => i.Subtotal).HasPrecision(18, 2);
            e.HasOne(i => i.Product)
             .WithMany()
             .HasForeignKey(i => i.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Testimonial>(e =>
        {
            e.HasKey(t => t.Id);
            e.Property(t => t.AuthorName).HasMaxLength(100);
        });

        modelBuilder.Entity<Store>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Name).HasMaxLength(100);
            e.Property(s => s.Phone).HasMaxLength(50);
        });
    }
}
