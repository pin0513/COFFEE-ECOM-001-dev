using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CoffeeShop.Api.Data;
using CoffeeShop.Api.Models;
using ExcelDataReader;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
        .SetIsOriginAllowed(origin =>
        {
            // 允許所有 localhost（任意 port）與正式域名
            var uri = new Uri(origin);
            return uri.Host == "localhost" || uri.Host == "127.0.0.1"
                || uri.Host.EndsWith(".pinhung.com")
                || uri.Host == "coffee88.com.tw" || uri.Host.EndsWith(".coffee88.com.tw");
        })
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

var jwtSecret = builder.Configuration["JwtSettings:Secret"]!;
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"]!;
var jwtAudience = builder.Configuration["JwtSettings:Audience"]!;
var jwtExpiry = int.Parse(builder.Configuration["JwtSettings:ExpiryMinutes"] ?? "1440");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "小葉咖啡店 API", Version = "v1.0" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/swagger/v1/swagger.json", "小葉咖啡店 API v1");
        o.RoutePrefix = string.Empty;
    });
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

var uploadPath = builder.Configuration["UploadPath"] ?? "data/uploads";
if (!Path.IsPathRooted(uploadPath))
    uploadPath = Path.Combine(Directory.GetCurrentDirectory(), uploadPath);

Directory.CreateDirectory(Path.Combine(uploadPath, "logo"));
Directory.CreateDirectory(Path.Combine(uploadPath, "products"));
Directory.CreateDirectory(Path.Combine(uploadPath, "stores"));
Directory.CreateDirectory(Path.Combine(uploadPath, "testimonials"));

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads"
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

string GenerateJwt(Admin admin)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, admin.Id.ToString()),
        new Claim(ClaimTypes.Email, admin.Email),
        new Claim(ClaimTypes.Name, admin.Name),
        new Claim(ClaimTypes.Role, admin.Role),
    };
    var token = new JwtSecurityToken(
        issuer: jwtIssuer, audience: jwtAudience, claims: claims,
        expires: DateTime.UtcNow.AddMinutes(jwtExpiry), signingCredentials: creds);
    return new JwtSecurityTokenHandler().WriteToken(token);
}

app.MapGet("/", () => new { Message = "小葉咖啡店 API", Version = "v1.0", Status = "Running" }).WithName("GetRoot");
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow })).WithName("Health");

// Auth
app.MapPost("/api/auth/login", async ([FromBody] LoginRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password))
        return Results.BadRequest(new { Message = "Email 和密碼不可為空" });
    var admin = await db.Admins.FirstOrDefaultAsync(a => a.Email == req.Email && a.IsActive);
    if (admin == null || !BCrypt.Net.BCrypt.Verify(req.Password, admin.PasswordHash))
        return Results.Unauthorized();
    var token = GenerateJwt(admin);
    return Results.Ok(new { Token = token, Admin = new { admin.Id, admin.Email, admin.Name, admin.Role } });
}).WithName("Login").WithTags("Auth");

app.MapGet("/api/auth/me", [Authorize] async (ClaimsPrincipal user, AppDbContext db) =>
{
    var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idStr, out var id)) return Results.Unauthorized();
    var admin = await db.Admins.FindAsync(id);
    if (admin == null || !admin.IsActive) return Results.Unauthorized();
    return Results.Ok(new { admin.Id, admin.Email, admin.Name, admin.Role });
}).WithName("GetMe").WithTags("Auth");

// Admins
app.MapGet("/api/admins", [Authorize] async (AppDbContext db) =>
    Results.Ok(await db.Admins.OrderBy(a => a.Id)
        .Select(a => new { a.Id, a.Email, a.Name, a.Role, a.IsActive, a.CreatedAt }).ToListAsync()))
.WithName("GetAdmins").WithTags("Admins");

app.MapPost("/api/admins", [Authorize] async ([FromBody] CreateAdminRequest req, AppDbContext db) =>
{
    if (await db.Admins.AnyAsync(a => a.Email == req.Email))
        return Results.Conflict(new { Message = "此 Email 已存在" });
    var admin = new Admin
    {
        Email = req.Email, PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
        Name = req.Name, Role = req.Role ?? "admin", IsActive = true, CreatedAt = DateTime.UtcNow
    };
    db.Admins.Add(admin);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admins/{admin.Id}", new { admin.Id, admin.Email, admin.Name, admin.Role });
}).WithName("CreateAdmin").WithTags("Admins");

app.MapPut("/api/admins/{id:int}", [Authorize] async (int id, [FromBody] UpdateAdminRequest req, AppDbContext db) =>
{
    var admin = await db.Admins.FindAsync(id);
    if (admin == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.Name)) admin.Name = req.Name;
    if (!string.IsNullOrEmpty(req.Role)) admin.Role = req.Role;
    if (!string.IsNullOrEmpty(req.Password)) admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
    if (req.IsActive.HasValue) admin.IsActive = req.IsActive.Value;
    admin.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { admin.Id, admin.Email, admin.Name, admin.Role, admin.IsActive });
}).WithName("UpdateAdmin").WithTags("Admins");

app.MapDelete("/api/admins/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var admin = await db.Admins.FindAsync(id);
    if (admin == null) return Results.NotFound();
    admin.IsActive = false; admin.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "管理員已停用" });
}).WithName("DeleteAdmin").WithTags("Admins");

// Categories
app.MapGet("/api/categories", async (AppDbContext db) =>
{
    var parents = await db.Categories
        .Where(c => c.IsActive && c.ParentId == null)
        .OrderBy(c => c.SortOrder)
        .ToListAsync();

    var childMap = await db.Categories
        .Where(c => c.IsActive && c.ParentId != null)
        .OrderBy(c => c.SortOrder)
        .ToListAsync();

    var productCounts = await db.Products
        .Where(p => p.IsActive)
        .GroupBy(p => p.CategoryId)
        .Select(g => new { CategoryId = g.Key, Count = g.Count() })
        .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

    var result = parents.Select(p => new
    {
        p.Id, p.Name, p.Code, p.Description, p.Icon, p.Color, p.SortOrder, p.SpecTemplate,
        ProductCount = productCounts.GetValueOrDefault(p.Id, 0),
        Children = childMap
            .Where(c => c.ParentId == p.Id)
            .Select(c => new
            {
                c.Id, c.Name, c.Code, c.Icon, c.SortOrder,
                ProductCount = productCounts.GetValueOrDefault(c.Id, 0)
            }).ToList()
    });
    return Results.Ok(result);
}).WithName("GetCategories").WithTags("Categories");

app.MapGet("/api/categories/{id:int}", async (int id, AppDbContext db) =>
{
    var cat = await db.Categories.FindAsync(id);
    return cat == null ? Results.NotFound() : Results.Ok(cat);
}).WithName("GetCategoryById").WithTags("Categories");

app.MapPost("/api/categories", [Authorize] async ([FromBody] CreateCategoryRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Name)) return Results.BadRequest(new { Message = "分類名稱不可為空" });
    if (string.IsNullOrEmpty(req.Code)) return Results.BadRequest(new { Message = "分類代碼不可為空" });
    if (req.ParentId.HasValue)
    {
        var parent = await db.Categories.FindAsync(req.ParentId.Value);
        if (parent == null) return Results.BadRequest(new { Message = "父分類不存在" });
        if (parent.ParentId != null) return Results.BadRequest(new { Message = "最多支援兩層分類" });
    }
    var cat = new Category
    {
        Name = req.Name, Code = req.Code.ToUpper(),
        Description = req.Description, Icon = req.Icon, Color = req.Color,
        ParentId = req.ParentId, SortOrder = req.SortOrder,
        SpecTemplate = req.SpecTemplate, IsActive = true, CreatedAt = DateTime.UtcNow
    };
    db.Categories.Add(cat);
    await db.SaveChangesAsync();
    return Results.Created($"/api/categories/{cat.Id}", new { cat.Id, cat.Name, cat.Code, cat.ParentId });
}).WithName("CreateCategory").WithTags("Categories");

app.MapPut("/api/categories/{id:int}", [Authorize] async (int id, [FromBody] UpdateCategoryRequest req, AppDbContext db) =>
{
    var cat = await db.Categories.FindAsync(id);
    if (cat == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.Name)) cat.Name = req.Name;
    if (req.Description != null) cat.Description = req.Description;
    if (req.SpecTemplate != null) cat.SpecTemplate = req.SpecTemplate;
    if (req.Icon != null) cat.Icon = req.Icon;
    if (req.SortOrder.HasValue) cat.SortOrder = req.SortOrder.Value;
    if (req.ParentId.HasValue)
    {
        if (req.ParentId.Value == 0) cat.ParentId = null;  // 0 = 清除父分類
        else
        {
            var parent = await db.Categories.FindAsync(req.ParentId.Value);
            if (parent != null && parent.ParentId == null) cat.ParentId = req.ParentId.Value;
        }
    }
    cat.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { cat.Id, cat.Name, cat.ParentId, cat.SpecTemplate });
}).WithName("UpdateCategory").WithTags("Categories");

// Products
app.MapGet("/api/products", async (
    [FromQuery] int? categoryId, [FromQuery] bool? featured, [FromQuery] bool? isActive,
    [FromQuery] bool? isOrderable,
    [FromQuery] bool? hasBulk, [FromQuery] bool? hasSub, [FromQuery] bool? hasPromo,
    [FromQuery] string? keyword,
    [FromQuery] int page = 1, [FromQuery] int pageSize = 20, AppDbContext db = null!) =>
{
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 20;
    var query = db.Products.Include(p => p.Category).AsQueryable();
    if (isOrderable.HasValue) query = query.Where(p => p.IsOrderable == isOrderable.Value);
    if (categoryId.HasValue)
    {
        var childIds = await db.Categories
            .Where(c => c.ParentId == categoryId.Value && c.IsActive)
            .Select(c => c.Id).ToListAsync();
        query = childIds.Any()
            ? query.Where(p => p.CategoryId == categoryId.Value || childIds.Contains(p.CategoryId))
            : query.Where(p => p.CategoryId == categoryId.Value);
    }
    if (featured.HasValue) query = query.Where(p => p.IsFeatured == featured.Value);
    if (isActive.HasValue) query = query.Where(p => p.IsActive == isActive.Value);
    if (hasBulk == true) query = query.Where(p => p.BulkOptions != null);
    if (hasSub == true) query = query.Where(p => p.SubscriptionOptions != null);
    if (hasPromo == true) query = query.Where(p => p.PromotionTag != null);
    if (!string.IsNullOrWhiteSpace(keyword))
    {
        var kw = $"%{keyword}%";
        query = query.Where(p => EF.Functions.ILike(p.Name, kw) ||
            (p.Brand != null && EF.Functions.ILike(p.Brand, kw)) ||
            EF.Functions.ILike(p.Sku, kw));
    }
    var total = await query.CountAsync();
    var products = await query.OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
        .Skip((page - 1) * pageSize).Take(pageSize)
        .Select(p => new { p.Id, p.Sku, p.Name, p.ShortDescription, p.Description,
            p.CategoryId, CategoryName = p.Category != null ? p.Category.Name : null,
            CategorySpecTemplate = p.Category != null ? p.Category.SpecTemplate : null,
            p.Price, p.ImageUrl, p.IsActive, p.IsFeatured, p.IsOrderable, p.InventoryEnabled,
            p.StockQuantity, p.Unit, p.SpecData, p.SortOrder, p.CreatedAt,
            p.BulkOptions, p.SubscriptionOptions, p.ParentProductId, p.VariantLabel,
            p.PromotionTag, p.RequirePrePayment, p.PromotionEndAt, p.Brand, p.OriginalPrice, p.HasGrindOption })
        .ToListAsync();
    return Results.Ok(new { Data = products, Page = page, PageSize = pageSize, TotalCount = total,
        TotalPages = (int)Math.Ceiling((double)total / pageSize) });
}).WithName("GetProducts").WithTags("Products");

app.MapGet("/api/products/{id:int}", async (int id, AppDbContext db) =>
{
    var p = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
    if (p == null) return Results.NotFound(new { Message = $"找不到商品 ID: {id}" });
    return Results.Ok(new { p.Id, p.Sku, p.Name, p.ShortDescription, p.Description,
        p.CategoryId, CategoryName = p.Category?.Name, CategorySpecTemplate = p.Category?.SpecTemplate,
        p.Price, p.ImageUrl, p.IsActive, p.IsFeatured,
        p.IsOrderable, p.InventoryEnabled, p.StockQuantity, p.Unit, p.SpecData, p.SortOrder, p.CreatedAt, p.UpdatedAt,
        p.BulkOptions, p.SubscriptionOptions, p.ParentProductId, p.VariantLabel,
        p.PromotionTag, p.RequirePrePayment, p.PromotionEndAt, p.Brand, p.OriginalPrice, p.HasGrindOption });
}).WithName("GetProductById").WithTags("Products");

app.MapPost("/api/products", [Authorize] async ([FromBody] UpsertProductRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Name)) return Results.BadRequest(new { Message = "商品名稱不可為空" });
    var product = new Product
    {
        Sku = req.Sku ?? Guid.NewGuid().ToString("N")[..8].ToUpper(),
        Name = req.Name, ShortDescription = req.ShortDescription, Description = req.Description,
        CategoryId = req.CategoryId ?? 1, Price = req.Price ?? 0, Unit = req.Unit ?? "磅",
        ImageUrl = req.ImageUrl, IsActive = req.IsActive ?? true, IsFeatured = req.IsFeatured ?? false,
        IsOrderable = req.IsOrderable ?? true, InventoryEnabled = req.InventoryEnabled ?? false,
        SortOrder = req.SortOrder ?? 0, CreatedAt = DateTime.UtcNow,
        BulkOptions = string.IsNullOrEmpty(req.BulkOptions) ? null : req.BulkOptions,
        SubscriptionOptions = string.IsNullOrEmpty(req.SubscriptionOptions) ? null : req.SubscriptionOptions,
        ParentProductId = req.ParentProductId == 0 ? null : req.ParentProductId,
        VariantLabel = string.IsNullOrEmpty(req.VariantLabel) ? null : req.VariantLabel,
        PromotionTag = string.IsNullOrEmpty(req.PromotionTag) ? null : req.PromotionTag,
        RequirePrePayment = req.RequirePrePayment ?? false,
        PromotionEndAt = req.PromotionEndAt,
        Brand = string.IsNullOrEmpty(req.Brand) ? null : req.Brand,
        OriginalPrice = req.OriginalPrice,
        HasGrindOption = req.HasGrindOption ?? false,
    };
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return Results.Created($"/api/products/{product.Id}", new { product.Id });
}).WithName("CreateProduct").WithTags("Products");

app.MapPut("/api/products/{id:int}", [Authorize] async (int id, [FromBody] UpsertProductRequest req, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.Name)) product.Name = req.Name;
    if (req.ShortDescription != null) product.ShortDescription = req.ShortDescription;
    if (req.Description != null) product.Description = req.Description;
    if (req.CategoryId.HasValue) product.CategoryId = req.CategoryId.Value;
    if (req.Price.HasValue) product.Price = req.Price.Value;
    if (!string.IsNullOrEmpty(req.Unit)) product.Unit = req.Unit;
    if (req.ImageUrl != null) product.ImageUrl = req.ImageUrl;
    if (req.IsActive.HasValue) product.IsActive = req.IsActive.Value;
    if (req.IsFeatured.HasValue) product.IsFeatured = req.IsFeatured.Value;
    if (req.IsOrderable.HasValue) product.IsOrderable = req.IsOrderable.Value;
    if (req.InventoryEnabled.HasValue) product.InventoryEnabled = req.InventoryEnabled.Value;
    if (req.SortOrder.HasValue) product.SortOrder = req.SortOrder.Value;
    if (req.SpecData != null) product.SpecData = req.SpecData;
    if (req.BulkOptions != null) product.BulkOptions = req.BulkOptions == "" ? null : req.BulkOptions;
    if (req.SubscriptionOptions != null) product.SubscriptionOptions = req.SubscriptionOptions == "" ? null : req.SubscriptionOptions;
    if (req.ParentProductId != null) product.ParentProductId = req.ParentProductId == 0 ? null : req.ParentProductId;
    if (req.VariantLabel != null) product.VariantLabel = req.VariantLabel == "" ? null : req.VariantLabel;
    if (req.PromotionTag != null) product.PromotionTag = req.PromotionTag == "" ? null : req.PromotionTag;
    if (req.RequirePrePayment.HasValue) product.RequirePrePayment = req.RequirePrePayment.Value;
    if (req.PromotionEndAt != null) product.PromotionEndAt = req.PromotionEndAt;
    if (req.Brand != null) product.Brand = req.Brand == "" ? null : req.Brand;
    if (req.OriginalPrice.HasValue) product.OriginalPrice = req.OriginalPrice;
    if (req.HasGrindOption.HasValue) product.HasGrindOption = req.HasGrindOption.Value;
    product.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { product.Id });
}).WithName("UpdateProduct").WithTags("Products");

// Batch product operations
app.MapPost("/api/products/batch", [Authorize] async ([FromBody] BatchProductRequest req, AppDbContext db) =>
{
    if (req.Ids == null || req.Ids.Count == 0)
        return Results.BadRequest(new { Message = "請提供商品 ID 列表" });

    var products = await db.Products.Where(p => req.Ids.Contains(p.Id)).ToListAsync();
    foreach (var product in products)
    {
        if (req.IsOrderable.HasValue) product.IsOrderable = req.IsOrderable.Value;
        if (req.IsActive.HasValue) product.IsActive = req.IsActive.Value;
        if (req.IsFeatured.HasValue) product.IsFeatured = req.IsFeatured.Value;
        product.UpdatedAt = DateTime.UtcNow;
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { Updated = products.Count });
}).WithName("BatchUpdateProducts").WithTags("Products");

app.MapGet("/api/products/{id:int}/variants", async (int id, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    var parentId = product.ParentProductId ?? id;
    var variants = await db.Products
        .Where(p => (p.ParentProductId == parentId || p.Id == parentId) && p.IsActive)
        .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
        .Select(p => new { p.Id, p.VariantLabel, p.Price, p.StockQuantity, p.ImageUrl, p.IsOrderable })
        .ToListAsync();
    return Results.Ok(variants);
}).WithName("GetProductVariants").WithTags("Products");

app.MapDelete("/api/products/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    db.Products.Remove(product);
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "商品已刪除" });
}).WithName("DeleteProduct").WithTags("Products");

app.MapPatch("/api/products/{id:int}/toggles", [Authorize] async (int id, [FromBody] ProductTogglesRequest req, AppDbContext db) =>
{
    var product = await db.Products.FindAsync(id);
    if (product == null) return Results.NotFound();
    if (req.IsOrderable.HasValue) product.IsOrderable = req.IsOrderable.Value;
    if (req.InventoryEnabled.HasValue) product.InventoryEnabled = req.InventoryEnabled.Value;
    if (req.IsActive.HasValue) product.IsActive = req.IsActive.Value;
    if (req.HasGrindOption.HasValue) product.HasGrindOption = req.HasGrindOption.Value;
    product.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { product.Id, product.IsOrderable, product.InventoryEnabled, product.IsActive, product.HasGrindOption });
}).WithName("UpdateProductToggles").WithTags("Products");

app.MapPost("/api/products/import", [Authorize] async (HttpRequest request, AppDbContext db) =>
{
    if (!request.HasFormContentType || request.Form.Files.Count == 0)
        return Results.BadRequest(new { Message = "請上傳檔案" });
    var file = request.Form.Files[0];
    var ext = Path.GetExtension(file.FileName).ToLower();
    if (ext != ".xlsx" && ext != ".xls" && ext != ".csv")
        return Results.BadRequest(new { Message = "僅支援 xlsx/xls/csv 格式" });

    var categories = await db.Categories.ToListAsync();
    var existingProducts = await db.Products.ToListAsync();
    int inserted = 0, updated = 0;
    var errors = new List<string>();
    var rows = new List<ImportRow>();

    try
    {
        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;

        if (ext == ".csv")
        {
            using var reader = new StreamReader(stream);
            using var csv = new CsvHelper.CsvReader(reader, System.Globalization.CultureInfo.InvariantCulture);
            csv.Read(); csv.ReadHeader();
            while (csv.Read())
            {
                rows.Add(new ImportRow
                {
                    Sku = csv.TryGetField("倉編號", out string? sku) ? sku?.Trim() : null,
                    Name = csv.TryGetField("商品名稱", out string? name) ? name?.Trim() : null,
                    CategoryName = csv.TryGetField("分類", out string? cat) ? cat?.Trim() : null,
                    PriceStr = csv.TryGetField("售價", out string? price) ? price?.Trim() : null,
                    Unit = csv.TryGetField("單位", out string? unit) ? unit?.Trim() : null,
                    ShortDescription = csv.TryGetField("產品敘述", out string? desc) ? desc?.Trim() : null,
                });
            }
        }
        else
        {
            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
            using var reader = ExcelReaderFactory.CreateReader(stream);
            var dataSet = reader.AsDataSet(new ExcelDataSetConfiguration
            {
                ConfigureDataTable = _ => new ExcelDataTableConfiguration { UseHeaderRow = true }
            });
            var table = dataSet.Tables[0];
            foreach (System.Data.DataRow row in table.Rows)
            {
                string? GetCell(string colName) =>
                    table.Columns.Contains(colName) ? row[colName]?.ToString()?.Trim() : null;
                rows.Add(new ImportRow
                {
                    Sku = GetCell("倉編號"), Name = GetCell("商品名稱"),
                    CategoryName = GetCell("分類"), PriceStr = GetCell("售價"),
                    Unit = GetCell("單位"), ShortDescription = GetCell("產品敘述"),
                });
            }
        }
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { Message = $"檔案解析失敗: {ex.Message}" });
    }

    foreach (var (row, i) in rows.Select((r, idx) => (r, idx + 2)))
    {
        if (string.IsNullOrEmpty(row.Sku)) { errors.Add($"Row {i}: 倉編號為空，跳過"); continue; }
        if (string.IsNullOrEmpty(row.Name)) { errors.Add($"Row {i} [{row.Sku}]: 商品名稱為空，跳過"); continue; }

        var cat = categories.FirstOrDefault(c => !string.IsNullOrEmpty(row.CategoryName) && c.Name.Contains(row.CategoryName));
        decimal? price = decimal.TryParse(row.PriceStr, out var p) ? p : null;
        var existing = existingProducts.FirstOrDefault(pr => pr.Sku.Equals(row.Sku, StringComparison.OrdinalIgnoreCase));

        if (existing != null)
        {
            existing.Name = row.Name;
            if (cat != null) existing.CategoryId = cat.Id;
            if (price.HasValue) existing.Price = price.Value;
            if (!string.IsNullOrEmpty(row.Unit)) existing.Unit = row.Unit;
            if (!string.IsNullOrEmpty(row.ShortDescription)) existing.ShortDescription = row.ShortDescription;
            existing.UpdatedAt = DateTime.UtcNow;
            updated++;
        }
        else
        {
            var newProduct = new Product
            {
                Sku = row.Sku, Name = row.Name,
                CategoryId = cat?.Id ?? categories.FirstOrDefault(c => c.Code == "OTHER")?.Id ?? 1,
                Price = price ?? 0, Unit = string.IsNullOrEmpty(row.Unit) ? "磅" : row.Unit,
                ShortDescription = row.ShortDescription, IsActive = true, IsOrderable = true,
                InventoryEnabled = false, CreatedAt = DateTime.UtcNow
            };
            db.Products.Add(newProduct);
            existingProducts.Add(newProduct);
            inserted++;
        }
    }

    await db.SaveChangesAsync();
    return Results.Ok(new { Inserted = inserted, Updated = updated, Errors = errors });
}).WithName("ImportProducts").WithTags("Products");

// Site Settings
app.MapGet("/api/site-settings", async (AppDbContext db) =>
    Results.Ok((await db.SiteSettings.ToListAsync()).ToDictionary(s => s.Key, s => s.Value)))
.WithName("GetSiteSettings").WithTags("SiteSettings");

app.MapPut("/api/site-settings", [Authorize] async ([FromBody] List<SiteSettingItem> items, AppDbContext db) =>
{
    foreach (var item in items)
    {
        var setting = await db.SiteSettings.FindAsync(item.Key);
        if (setting != null) { setting.Value = item.Value ?? string.Empty; setting.UpdatedAt = DateTime.UtcNow; }
        else db.SiteSettings.Add(new SiteSetting { Key = item.Key, Value = item.Value ?? string.Empty, UpdatedAt = DateTime.UtcNow });
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "設定已儲存" });
}).WithName("UpdateSiteSettings").WithTags("SiteSettings");

// Uploads
async Task<IResult> HandleUpload(string category, HttpRequest request, IConfiguration config)
{
    var allowed = new[] { "logo", "products", "stores", "testimonials" };
    if (!allowed.Contains(category)) return Results.BadRequest(new { Message = "不允許的上傳分類" });
    if (!request.HasFormContentType || request.Form.Files.Count == 0) return Results.BadRequest(new { Message = "請上傳檔案" });
    var file = request.Form.Files[0];
    var ext = Path.GetExtension(file.FileName).ToLower();
    if (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp") return Results.BadRequest(new { Message = "僅支援 jpg/png/webp 格式" });
    if (file.Length > 5 * 1024 * 1024) return Results.BadRequest(new { Message = "檔案大小不可超過 5MB" });
    var basePath = config["UploadPath"] ?? "data/uploads";
    if (!Path.IsPathRooted(basePath)) basePath = Path.Combine(Directory.GetCurrentDirectory(), basePath);
    var categoryPath = Path.Combine(basePath, category);
    Directory.CreateDirectory(categoryPath);
    var fileName = $"{Guid.NewGuid():N}{ext}";
    using (var s = File.Create(Path.Combine(categoryPath, fileName))) await file.CopyToAsync(s);
    return Results.Ok(new { Url = $"/uploads/{category}/{fileName}" });
}

app.MapPost("/api/uploads/{category}", [Authorize] async (string category, HttpRequest request, IConfiguration config) =>
    await HandleUpload(category, request, config)).WithName("UploadFile").WithTags("Uploads");

app.MapPost("/api/uploads/products/{productId:int}", [Authorize] async (int productId, HttpRequest request, IConfiguration config) =>
    await HandleUpload("products", request, config)).WithName("UploadProductImage").WithTags("Uploads");

// Customers
app.MapPost("/api/customers", async ([FromBody] CreateCustomerRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Email)) return Results.BadRequest(new { Message = "Email 不可為空" });
    var existing = await db.Customers.FirstOrDefaultAsync(c => c.Email == req.Email);
    if (existing != null)
    {
        if (!string.IsNullOrEmpty(req.Name)) existing.Name = req.Name;
        if (!string.IsNullOrEmpty(req.Phone)) existing.Phone = req.Phone;
        if (!string.IsNullOrEmpty(req.Address)) existing.Address = req.Address;
        existing.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(new { existing.Id, existing.Email, existing.Name });
    }
    var customerCount = await db.Customers.CountAsync();
    var customer = new Customer
    {
        CustomerNumber = $"C{customerCount + 1:00000}",
        Name = req.Name ?? req.Email,
        Email = req.Email,
        Phone = req.Phone ?? "",
        Address = req.Address,
        PasswordHash = "",
        CreatedAt = DateTime.UtcNow
    };
    db.Customers.Add(customer);
    await db.SaveChangesAsync();
    return Results.Created($"/api/customers/{customer.Id}", new { customer.Id, customer.Email, customer.Name });
}).WithName("CreateCustomer").WithTags("Customers");

app.MapGet("/api/customers", [Authorize] async (AppDbContext db, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? keyword = null) =>
{
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 20;
    var query = db.Customers.AsQueryable();
    if (!string.IsNullOrWhiteSpace(keyword))
        query = query.Where(c => c.Name.Contains(keyword) || c.Email.Contains(keyword));
    var total = await query.CountAsync();
    var customers = await query
        .OrderByDescending(c => c.CreatedAt)
        .Skip((page - 1) * pageSize).Take(pageSize)
        .Select(c => new { c.Id, c.CustomerNumber, c.Name, c.Email, c.Phone, c.Address, c.Type, c.IsActive, c.CreatedAt,
            OrderCount = db.Orders.Count(o => o.CustomerId == c.Id) })
        .ToListAsync();
    return Results.Ok(new { Data = customers, Page = page, PageSize = pageSize, TotalCount = total,
        TotalPages = (int)Math.Ceiling((double)total / pageSize) });
}).WithName("GetCustomers").WithTags("Customers");

// Orders
app.MapPost("/api/orders", async ([FromBody] CreateOrderRequest req, AppDbContext db, IConfiguration config) =>
{
    if (string.IsNullOrEmpty(req.CustomerEmail)) return Results.BadRequest(new { Message = "聯絡 Email 不可為空" });
    if (req.Items == null || req.Items.Count == 0) return Results.BadRequest(new { Message = "訂單明細不可為空" });

    // Upsert customer
    var customer = await db.Customers.FirstOrDefaultAsync(c => c.Email == req.CustomerEmail);
    if (customer == null)
    {
        var cnt = await db.Customers.CountAsync();
        customer = new Customer
        {
            CustomerNumber = $"C{cnt + 1:00000}",
            Name = req.RecipientName,
            Email = req.CustomerEmail,
            Phone = req.RecipientPhone ?? "",
            Address = req.ShippingAddress,
            PasswordHash = "",
            CreatedAt = DateTime.UtcNow
        };
        db.Customers.Add(customer);
        await db.SaveChangesAsync();
    }

    // Resolve products
    var productIds = req.Items.Select(i => i.ProductId).ToList();
    var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

    var orderItems = new List<OrderItem>();
    decimal subtotal = 0;
    foreach (var item in req.Items)
    {
        var product = products.FirstOrDefault(p => p.Id == item.ProductId);
        if (product == null) return Results.BadRequest(new { Message = $"找不到商品 ID: {item.ProductId}" });
        if (!product.IsOrderable) return Results.BadRequest(new { Message = $"商品「{product.Name}」目前無法下單" });
        var lineTotal = product.Price * item.Quantity;
        subtotal += lineTotal;
        orderItems.Add(new OrderItem
        {
            ProductId = product.Id,
            ProductName = product.Name,
            ProductSku = product.Sku,
            UnitPrice = product.Price,
            Quantity = item.Quantity,
            DiscountAmount = 0,
            Subtotal = lineTotal
        });
    }

    var paymentMethod = req.PaymentMethod?.ToLower() switch
    {
        "banktransfer" or "transfer" => PaymentMethod.BankTransfer,
        "cash" or "cashondelivery" => PaymentMethod.CashOnDelivery,
        _ => PaymentMethod.CashOnDelivery
    };

    var order = new Order
    {
        OrderNumber = "",
        CustomerId = customer.Id,
        Status = OrderStatus.Pending,
        Subtotal = subtotal,
        ShippingFee = 0,
        DiscountAmount = req.DiscountAmount ?? 0,
        TotalAmount = subtotal - (req.DiscountAmount ?? 0),
        PaymentMethod = paymentMethod,
        PaymentStatus = PaymentStatus.Unpaid,
        RecipientName = req.RecipientName,
        RecipientPhone = req.RecipientPhone ?? "",
        ShippingAddress = req.ShippingAddress ?? "",
        Notes = req.Notes,
        TransferCode = req.TransferCode,
        OrderDate = DateTime.UtcNow,
        CreatedAt = DateTime.UtcNow,
        Items = orderItems
    };
    db.Orders.Add(order);
    await db.SaveChangesAsync();

    // Set order number after getting ID
    order.OrderNumber = $"ORD{DateTime.UtcNow:yyyyMMdd}{order.Id:0000}";
    await db.SaveChangesAsync();

    // Send notification email (best effort)
    _ = Task.Run(async () =>
    {
        try
        {
            await using var scope2 = app.Services.CreateAsyncScope();
            var db2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifEmail = (await db2.SiteSettings.FindAsync("order_notification_email"))?.Value;
            if (string.IsNullOrEmpty(notifEmail)) return;

            var smtpHost = config["SmtpSettings:Host"];
            var smtpUser = config["SmtpSettings:Username"];
            var smtpPass = config["SmtpSettings:Password"];
            var smtpFrom = config["SmtpSettings:FromEmail"];
            var smtpPort = int.TryParse(config["SmtpSettings:Port"], out var p) ? p : 587;
            var fromName = config["SmtpSettings:FromName"] ?? "品皇咖啡";

            if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpFrom)) return;

            var itemLines = string.Join("\n", orderItems.Select(i =>
                $"  - {i.ProductName} x{i.Quantity} = NT${i.Subtotal:0}"));
            var methodText = paymentMethod == PaymentMethod.BankTransfer ? "銀行轉帳" : "貨到付款";
            var transferLine = !string.IsNullOrEmpty(order.TransferCode)
                ? $"轉帳後5碼：{order.TransferCode}\n" : "";

            var body = $"""
                新訂單通知

                訂單編號：{order.OrderNumber}
                訂單時間：{order.OrderDate:yyyy-MM-dd HH:mm}

                收件人：{order.RecipientName}
                電話：{order.RecipientPhone}
                地址：{order.ShippingAddress}

                付款方式：{methodText}
                {transferLine}
                訂單明細：
                {itemLines}

                訂單總計：NT${order.TotalAmount:0}

                備註：{order.Notes ?? "無"}
                """;

            using var client = new System.Net.Mail.SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true,
                Credentials = new System.Net.NetworkCredential(smtpUser, smtpPass)
            };
            using var msg = new System.Net.Mail.MailMessage
            {
                From = new System.Net.Mail.MailAddress(smtpFrom, fromName),
                Subject = $"【新訂單】{order.OrderNumber} - {order.RecipientName}",
                Body = body
            };
            msg.To.Add(notifEmail);
            await client.SendMailAsync(msg);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Email] 發送失敗: {ex.Message}");
        }
    });

    return Results.Created($"/api/orders/{order.Id}", new
    {
        order.Id,
        order.OrderNumber,
        order.TotalAmount,
        Status = order.Status.ToString(),
        PaymentMethod = order.PaymentMethod.ToString()
    });
}).WithName("CreateOrder").WithTags("Orders");

app.MapGet("/api/orders", [Authorize] async (
    AppDbContext db,
    [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
    [FromQuery] string? status = null, [FromQuery] string? paymentStatus = null) =>
{
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 20;
    var query = db.Orders.Include(o => o.Customer).Include(o => o.Items).AsQueryable();
    if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var s))
        query = query.Where(o => o.Status == s);
    if (!string.IsNullOrEmpty(paymentStatus) && Enum.TryParse<PaymentStatus>(paymentStatus, true, out var ps))
        query = query.Where(o => o.PaymentStatus == ps);
    var total = await query.CountAsync();
    var orders = await query.OrderByDescending(o => o.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize)
        .Select(o => new
        {
            o.Id, o.OrderNumber, o.CustomerId,
            CustomerName = o.Customer != null ? o.Customer.Name : "",
            CustomerEmail = o.Customer != null ? o.Customer.Email : "",
            o.TotalAmount, o.Subtotal, o.DiscountAmount,
            Status = o.Status.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            PaymentMethod = o.PaymentMethod.ToString(),
            o.RecipientName, o.RecipientPhone, o.ShippingAddress, o.Notes, o.TransferCode,
            o.OrderDate, o.CreatedAt,
            ItemCount = o.Items.Count
        }).ToListAsync();
    return Results.Ok(new { Data = orders, Page = page, PageSize = pageSize, TotalCount = total,
        TotalPages = (int)Math.Ceiling((double)total / pageSize) });
}).WithName("GetOrders").WithTags("Orders");

app.MapGet("/api/orders/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var order = await db.Orders.Include(o => o.Customer).Include(o => o.Items).ThenInclude(i => i.Product)
        .FirstOrDefaultAsync(o => o.Id == id);
    if (order == null) return Results.NotFound();
    return Results.Ok(new
    {
        order.Id, order.OrderNumber, order.CustomerId,
        CustomerName = order.Customer?.Name, CustomerEmail = order.Customer?.Email,
        order.TotalAmount, order.Subtotal, order.DiscountAmount, order.ShippingFee,
        Status = order.Status.ToString(),
        PaymentStatus = order.PaymentStatus.ToString(),
        PaymentMethod = order.PaymentMethod.ToString(),
        order.RecipientName, order.RecipientPhone, order.ShippingAddress, order.Notes, order.TransferCode,
        order.OrderDate, order.CreatedAt,
        Items = order.Items.Select(i => new
        {
            i.Id, i.ProductId, i.ProductName, i.ProductSku, i.UnitPrice, i.Quantity, i.DiscountAmount, i.Subtotal
        })
    });
}).WithName("GetOrderById").WithTags("Orders");

app.MapPatch("/api/orders/{id:int}/status", [Authorize] async (int id, [FromBody] UpdateOrderStatusRequest req, AppDbContext db) =>
{
    var order = await db.Orders.FindAsync(id);
    if (order == null) return Results.NotFound();
    if (Enum.TryParse<OrderStatus>(req.Status, true, out var s)) order.Status = s;
    if (!string.IsNullOrEmpty(req.PaymentStatus) && Enum.TryParse<PaymentStatus>(req.PaymentStatus, true, out var ps))
        order.PaymentStatus = ps;
    order.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { order.Id, Status = order.Status.ToString(), PaymentStatus = order.PaymentStatus.ToString() });
}).WithName("UpdateOrderStatus").WithTags("Orders");

// ── Payment Gateway ──────────────────────────────────────────────────────────

// POST /api/payment/ecpay/checkout?orderId=xxx — 回傳 ECPay 自動提交 HTML Form
app.MapPost("/api/payment/ecpay/checkout", async (int orderId, AppDbContext db, IConfiguration config) =>
{
    var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId);
    if (order == null) return Results.NotFound(new { error = "訂單不存在" });

    var ecpay = config.GetSection("ECPay");
    var merchantId   = ecpay["MerchantId"] ?? "";
    var hashKey      = ecpay["HashKey"]    ?? "";
    var hashIV       = ecpay["HashIV"]     ?? "";
    var isProduction = ecpay.GetValue<bool>("IsProduction");
    var returnUrl    = ecpay["ReturnUrl"]       ?? "";
    var resultUrl    = ecpay["OrderResultUrl"]  ?? "";

    var actionUrl = isProduction
        ? "https://payment.ecpay.com.tw/Cashier/AioCheckout/index"
        : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckout/index";

    // 綠界 MerchantTradeNo 限 20 碼英數
    var tradeNo = $"PH{order.Id:D10}{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 100000:D5}";
    if (tradeNo.Length > 20) tradeNo = tradeNo[..20];

    var itemNames = order.Items.Select(i => $"{i.ProductName ?? "商品"} x{i.Quantity}").ToList();
    var itemName  = string.Join("#", itemNames);
    if (itemName.Length > 400) itemName = itemName[..400];

    var parameters = new SortedDictionary<string, string>
    {
        ["MerchantID"]        = merchantId,
        ["MerchantTradeNo"]   = tradeNo,
        ["MerchantTradeDate"] = DateTime.Now.ToString("yyyy/MM/dd HH:mm:ss"),
        ["PaymentType"]       = "aio",
        ["TotalAmount"]       = ((int)order.TotalAmount).ToString(),
        ["TradeDesc"]         = "品皇咖啡訂購",
        ["ItemName"]          = itemName,
        ["ReturnURL"]         = returnUrl,
        ["OrderResultURL"]    = resultUrl,
        ["ChoosePayment"]     = "ALL",
        ["EncryptType"]       = "1",
    };

    parameters["CheckMacValue"] = EcpayCheckMacValue(parameters, hashKey, hashIV);

    // 儲存 tradeNo 供後續核對
    order.EcpayTradeNo = tradeNo;
    order.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    var formHtml = BuildEcpayForm(actionUrl, parameters);
    return Results.Ok(new { formHtml });
}).WithName("EcpayCheckout").WithTags("Payment");

// POST /api/payment/ecpay/notify — ECPay 非同步通知（更新付款狀態）
app.MapPost("/api/payment/ecpay/notify", async (HttpRequest request, AppDbContext db, IConfiguration config) =>
{
    var form = await request.ReadFormAsync();
    var rtnCode      = form["RtnCode"].ToString();
    var tradeNo      = form["MerchantTradeNo"].ToString();
    var checkMac     = form["CheckMacValue"].ToString();

    var ecpay  = config.GetSection("ECPay");
    var hashKey = ecpay["HashKey"] ?? "";
    var hashIV  = ecpay["HashIV"]  ?? "";

    // 驗證 CheckMacValue
    var allFields = form.Keys
        .Where(k => k != "CheckMacValue")
        .ToDictionary(k => k, k => form[k].ToString());
    var sortedFields = new SortedDictionary<string, string>(allFields);
    var expected = EcpayCheckMacValue(sortedFields, hashKey, hashIV);

    if (!string.Equals(expected, checkMac, StringComparison.OrdinalIgnoreCase))
        return Results.Content("0|Error", "text/plain");

    var order = await db.Orders.FirstOrDefaultAsync(o => o.EcpayTradeNo == tradeNo);
    if (order != null && rtnCode == "1")
    {
        order.PaymentStatus = PaymentStatus.Paid;
        order.Status = OrderStatus.Paid;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }
    return Results.Content("1|OK", "text/plain");
}).WithName("EcpayNotify").WithTags("Payment");

// GET /api/payment/ecpay/return — ECPay 同步返回（redirect to 前台結果頁）
app.MapGet("/api/payment/ecpay/return", (HttpRequest request, IConfiguration config) =>
{
    var rtnCode = request.Query["RtnCode"].ToString();
    var frontendBase = config["AppDomain"] ?? "http://localhost:5173";
    var redirectUrl = rtnCode == "1"
        ? $"{frontendBase}/payment/return?status=success&method=ecpay&rtnCode={rtnCode}"
        : $"{frontendBase}/payment/return?status=fail&method=ecpay&rtnCode={rtnCode}";
    return Results.Redirect(redirectUrl);
}).WithName("EcpayReturn").WithTags("Payment");

// POST /api/payment/linepay/request?orderId=xxx — 建立 LINE Pay 付款請求，回傳 paymentUrl
app.MapPost("/api/payment/linepay/request", async (int orderId, AppDbContext db, IConfiguration config) =>
{
    var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId);
    if (order == null) return Results.NotFound(new { error = "訂單不存在" });

    var linepay      = config.GetSection("LinePay");
    var channelId    = linepay["ChannelId"]          ?? "";
    var channelSecret = linepay["ChannelSecretKey"]  ?? "";
    var isProduction = linepay.GetValue<bool>("IsProduction");
    var confirmUrl   = linepay["ConfirmUrl"] ?? "";
    var cancelUrl    = linepay["CancelUrl"]  ?? "";

    var apiBase = isProduction
        ? "https://api-pay.line.me"
        : "https://sandbox-api-pay.line.me";
    var apiPath = "/v3/payments/request";

    var packages = new[]
    {
        new
        {
            id = order.OrderNumber,
            amount = (int)order.TotalAmount,
            name = "品皇咖啡訂購",
            products = order.Items.Select(i => new
            {
                name = i.ProductName ?? "商品",
                quantity = i.Quantity,
                price = (int)i.UnitPrice
            }).ToArray()
        }
    };

    var requestBody = System.Text.Json.JsonSerializer.Serialize(new
    {
        amount = (int)order.TotalAmount,
        currency = "TWD",
        orderId = order.OrderNumber,
        packages,
        redirectUrls = new { confirmUrl = $"{confirmUrl}?type=linepay&orderId={order.Id}", cancelUrl }
    });

    var nonce    = Guid.NewGuid().ToString("N");
    var sigText  = channelSecret + apiPath + requestBody + nonce;
    var sigBytes = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(channelSecret))
        .ComputeHash(Encoding.UTF8.GetBytes(sigText));
    var signature = Convert.ToBase64String(sigBytes);

    using var http = new System.Net.Http.HttpClient();
    http.DefaultRequestHeaders.Add("X-LINE-ChannelId", channelId);
    http.DefaultRequestHeaders.Add("X-LINE-Authorization-Nonce", nonce);
    http.DefaultRequestHeaders.Add("X-LINE-Authorization", signature);

    var resp = await http.PostAsync(
        $"{apiBase}{apiPath}",
        new System.Net.Http.StringContent(requestBody, Encoding.UTF8, "application/json"));
    var respJson = await resp.Content.ReadAsStringAsync();

    using var doc = System.Text.Json.JsonDocument.Parse(respJson);
    var returnCode = doc.RootElement.GetProperty("returnCode").GetString();
    if (returnCode != "0000")
        return Results.BadRequest(new { error = $"LINE Pay 建立失敗：{returnCode}" });

    var paymentUrl = doc.RootElement
        .GetProperty("info").GetProperty("paymentUrl").GetProperty("web").GetString();
    var transactionId = doc.RootElement
        .GetProperty("info").GetProperty("transactionId").GetInt64();

    order.LinePayTransactionId = transactionId.ToString();
    order.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    return Results.Ok(new { paymentUrl });
}).WithName("LinePayRequest").WithTags("Payment");

// GET /api/payment/linepay/confirm?transactionId=xxx&orderId=xxx — LINE Pay 確認付款
app.MapGet("/api/payment/linepay/confirm", async (long transactionId, int orderId, AppDbContext db, IConfiguration config) =>
{
    var order = await db.Orders.FindAsync(orderId);
    if (order == null) return Results.NotFound(new { error = "訂單不存在" });

    var linepay       = config.GetSection("LinePay");
    var channelId     = linepay["ChannelId"]         ?? "";
    var channelSecret = linepay["ChannelSecretKey"]  ?? "";
    var isProduction  = linepay.GetValue<bool>("IsProduction");
    var apiBase       = isProduction ? "https://api-pay.line.me" : "https://sandbox-api-pay.line.me";
    var apiPath       = $"/v3/payments/{transactionId}/confirm";

    var requestBody = System.Text.Json.JsonSerializer.Serialize(new
    {
        amount = (int)order.TotalAmount,
        currency = "TWD"
    });

    var nonce    = Guid.NewGuid().ToString("N");
    var sigText  = channelSecret + apiPath + requestBody + nonce;
    var sigBytes = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(channelSecret))
        .ComputeHash(Encoding.UTF8.GetBytes(sigText));
    var signature = Convert.ToBase64String(sigBytes);

    using var http = new System.Net.Http.HttpClient();
    http.DefaultRequestHeaders.Add("X-LINE-ChannelId", channelId);
    http.DefaultRequestHeaders.Add("X-LINE-Authorization-Nonce", nonce);
    http.DefaultRequestHeaders.Add("X-LINE-Authorization", signature);

    var resp = await http.PostAsync(
        $"{apiBase}{apiPath}",
        new System.Net.Http.StringContent(requestBody, Encoding.UTF8, "application/json"));
    var respJson = await resp.Content.ReadAsStringAsync();

    using var doc = System.Text.Json.JsonDocument.Parse(respJson);
    var returnCode = doc.RootElement.GetProperty("returnCode").GetString();

    if (returnCode == "0000")
    {
        order.PaymentStatus = PaymentStatus.Paid;
        order.Status = OrderStatus.Paid;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(new { success = true });
    }
    return Results.Ok(new { success = false, returnCode });
}).WithName("LinePayConfirm").WithTags("Payment");

// GET /api/payment/linepay/cancel — LINE Pay 取消
app.MapGet("/api/payment/linepay/cancel", (int orderId) =>
    Results.Ok(new { cancelled = true, orderId })
).WithName("LinePayCancel").WithTags("Payment");

// ── ECPay Helper ─────────────────────────────────────────────────────────────

static string EcpayCheckMacValue(IDictionary<string, string> parameters, string hashKey, string hashIV)
{
    var raw = string.Join("&", parameters
        .OrderBy(kv => kv.Key, StringComparer.OrdinalIgnoreCase)
        .Select(kv => $"{kv.Key}={kv.Value}"));
    raw = $"HashKey={hashKey}&{raw}&HashIV={hashIV}";

    // URL encode（小寫）
    raw = Uri.EscapeDataString(raw).ToLower()
        .Replace("%21", "!")
        .Replace("%2a", "*")
        .Replace("%28", "(")
        .Replace("%29", ")")
        .Replace("%20", "+");

    // SHA256（大寫 hex）
    var bytes = System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(raw));
    return Convert.ToHexString(bytes).ToUpper();
}

static string BuildEcpayForm(string actionUrl, IDictionary<string, string> parameters)
{
    var inputs = string.Join("\n", parameters.Select(
        kv => $"<input type='hidden' name='{kv.Key}' value='{kv.Value}' />"));
    return $"""
        <form id='ecpay' method='post' action='{actionUrl}'>
          {inputs}
        </form>
        <script>document.getElementById('ecpay').submit();</script>
        """;
}

// Testimonials
app.MapGet("/api/testimonials", async (AppDbContext db) =>
    Results.Ok(await db.Testimonials
        .Where(t => t.IsVisible)
        .OrderBy(t => t.SortOrder).ThenBy(t => t.Id)
        .Select(t => new { t.Id, t.Content, t.AuthorName, t.Rating, t.ImageUrl, t.SortOrder })
        .ToListAsync()))
.WithName("GetTestimonials").WithTags("Testimonials");

app.MapGet("/api/testimonials/all", [Authorize] async (AppDbContext db) =>
    Results.Ok(await db.Testimonials
        .OrderBy(t => t.SortOrder).ThenBy(t => t.Id)
        .Select(t => new { t.Id, t.Content, t.AuthorName, t.Rating, t.ImageUrl, t.IsVisible, t.SortOrder, t.CreatedAt })
        .ToListAsync()))
.WithName("GetAllTestimonials").WithTags("Testimonials");

app.MapPost("/api/testimonials", [Authorize] async ([FromBody] UpsertTestimonialRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Content)) return Results.BadRequest(new { Message = "評價內容不可為空" });
    var t = new Testimonial
    {
        Content = req.Content,
        AuthorName = req.AuthorName ?? "匿名",
        Rating = req.Rating is >= 1 and <= 5 ? req.Rating : 5,
        ImageUrl = req.ImageUrl ?? "",
        IsVisible = req.IsVisible ?? true,
        SortOrder = req.SortOrder ?? 0,
        CreatedAt = DateTime.UtcNow
    };
    db.Testimonials.Add(t);
    await db.SaveChangesAsync();
    return Results.Created($"/api/testimonials/{t.Id}", new { t.Id });
}).WithName("CreateTestimonial").WithTags("Testimonials");

app.MapPut("/api/testimonials/{id:int}", [Authorize] async (int id, [FromBody] UpsertTestimonialRequest req, AppDbContext db) =>
{
    var t = await db.Testimonials.FindAsync(id);
    if (t == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.Content)) t.Content = req.Content;
    if (req.AuthorName != null) t.AuthorName = req.AuthorName;
    if (req.Rating is >= 1 and <= 5) t.Rating = req.Rating;
    if (req.ImageUrl != null) t.ImageUrl = req.ImageUrl;
    if (req.IsVisible.HasValue) t.IsVisible = req.IsVisible.Value;
    if (req.SortOrder.HasValue) t.SortOrder = req.SortOrder.Value;
    t.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { t.Id });
}).WithName("UpdateTestimonial").WithTags("Testimonials");

app.MapDelete("/api/testimonials/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var t = await db.Testimonials.FindAsync(id);
    if (t == null) return Results.NotFound();
    db.Testimonials.Remove(t);
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "評價已刪除" });
}).WithName("DeleteTestimonial").WithTags("Testimonials");

app.MapPatch("/api/testimonials/{id:int}/toggle", [Authorize] async (int id, AppDbContext db) =>
{
    var t = await db.Testimonials.FindAsync(id);
    if (t == null) return Results.NotFound();
    t.IsVisible = !t.IsVisible;
    t.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { t.Id, t.IsVisible });
}).WithName("ToggleTestimonial").WithTags("Testimonials");

// Stores
app.MapGet("/api/stores", async (AppDbContext db) =>
    Results.Ok(await db.Stores
        .Where(s => s.IsVisible)
        .OrderBy(s => s.SortOrder).ThenBy(s => s.Id)
        .Select(s => new { s.Id, s.Name, s.Address, s.Phone, s.BusinessHours, s.ImageUrl, s.SortOrder })
        .ToListAsync()))
.WithName("GetStores").WithTags("Stores");

app.MapPost("/api/stores", [Authorize] async ([FromBody] UpsertStoreRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Name)) return Results.BadRequest(new { Message = "門市名稱不可為空" });
    var s = new Store
    {
        Name = req.Name,
        Address = req.Address ?? "",
        Phone = req.Phone ?? "",
        BusinessHours = req.BusinessHours ?? "",
        ImageUrl = req.ImageUrl ?? "",
        IsVisible = req.IsVisible ?? true,
        SortOrder = req.SortOrder ?? 0,
        CreatedAt = DateTime.UtcNow
    };
    db.Stores.Add(s);
    await db.SaveChangesAsync();
    return Results.Created($"/api/stores/{s.Id}", new { s.Id });
}).WithName("CreateStore").WithTags("Stores");

app.MapPut("/api/stores/{id:int}", [Authorize] async (int id, [FromBody] UpsertStoreRequest req, AppDbContext db) =>
{
    var s = await db.Stores.FindAsync(id);
    if (s == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.Name)) s.Name = req.Name;
    if (req.Address != null) s.Address = req.Address;
    if (req.Phone != null) s.Phone = req.Phone;
    if (req.BusinessHours != null) s.BusinessHours = req.BusinessHours;
    if (req.ImageUrl != null) s.ImageUrl = req.ImageUrl;
    if (req.IsVisible.HasValue) s.IsVisible = req.IsVisible.Value;
    if (req.SortOrder.HasValue) s.SortOrder = req.SortOrder.Value;
    s.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { s.Id });
}).WithName("UpdateStore").WithTags("Stores");

app.MapDelete("/api/stores/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var s = await db.Stores.FindAsync(id);
    if (s == null) return Results.NotFound();
    db.Stores.Remove(s);
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "門市已刪除" });
}).WithName("DeleteStore").WithTags("Stores");

app.MapPatch("/api/stores/{id:int}/toggle", [Authorize] async (int id, AppDbContext db) =>
{
    var s = await db.Stores.FindAsync(id);
    if (s == null) return Results.NotFound();
    s.IsVisible = !s.IsVisible;
    s.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { s.Id, s.IsVisible });
}).WithName("ToggleStore").WithTags("Stores");

// Hero Banners
app.MapGet("/api/hero-banners", async (AppDbContext db) =>
    Results.Ok(await db.HeroBanners
        .Where(b => b.IsActive)
        .OrderBy(b => b.SortOrder).ThenBy(b => b.Id)
        .Select(b => new { b.Id, b.Title, b.SubTitle, b.ButtonText, b.ButtonUrl, b.ImageUrl, b.SortOrder, b.IsActive })
        .ToListAsync()))
.WithName("GetHeroBanners").WithTags("HeroBanners");

app.MapGet("/api/hero-banners/all", [Authorize] async (AppDbContext db) =>
    Results.Ok(await db.HeroBanners
        .OrderBy(b => b.SortOrder).ThenBy(b => b.Id)
        .Select(b => new { b.Id, b.Title, b.SubTitle, b.ButtonText, b.ButtonUrl, b.ImageUrl, b.SortOrder, b.IsActive, b.CreatedAt, b.UpdatedAt })
        .ToListAsync()))
.WithName("GetAllHeroBanners").WithTags("HeroBanners");

app.MapPost("/api/hero-banners", [Authorize] async ([FromBody] UpsertHeroBannerRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Title)) return Results.BadRequest(new { Message = "標題不可為空" });
    var banner = new HeroBanner
    {
        Title = req.Title,
        SubTitle = string.IsNullOrEmpty(req.SubTitle) ? null : req.SubTitle,
        ButtonText = string.IsNullOrEmpty(req.ButtonText) ? null : req.ButtonText,
        ButtonUrl = string.IsNullOrEmpty(req.ButtonUrl) ? null : req.ButtonUrl,
        ImageUrl = string.IsNullOrEmpty(req.ImageUrl) ? null : req.ImageUrl,
        SortOrder = req.SortOrder ?? 0,
        IsActive = req.IsActive ?? true,
        CreatedAt = DateTime.UtcNow,
    };
    db.HeroBanners.Add(banner);
    await db.SaveChangesAsync();
    return Results.Created($"/api/hero-banners/{banner.Id}", new { banner.Id });
}).WithName("CreateHeroBanner").WithTags("HeroBanners");

app.MapPut("/api/hero-banners/{id:int}", [Authorize] async (int id, [FromBody] UpsertHeroBannerRequest req, AppDbContext db) =>
{
    var banner = await db.HeroBanners.FindAsync(id);
    if (banner == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.Title)) banner.Title = req.Title;
    if (req.SubTitle != null) banner.SubTitle = req.SubTitle == "" ? null : req.SubTitle;
    if (req.ButtonText != null) banner.ButtonText = req.ButtonText == "" ? null : req.ButtonText;
    if (req.ButtonUrl != null) banner.ButtonUrl = req.ButtonUrl == "" ? null : req.ButtonUrl;
    if (req.ImageUrl != null) banner.ImageUrl = req.ImageUrl == "" ? null : req.ImageUrl;
    if (req.SortOrder.HasValue) banner.SortOrder = req.SortOrder.Value;
    if (req.IsActive.HasValue) banner.IsActive = req.IsActive.Value;
    banner.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { banner.Id });
}).WithName("UpdateHeroBanner").WithTags("HeroBanners");

app.MapDelete("/api/hero-banners/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var banner = await db.HeroBanners.FindAsync(id);
    if (banner == null) return Results.NotFound();
    db.HeroBanners.Remove(banner);
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "Banner 已刪除" });
}).WithName("DeleteHeroBanner").WithTags("HeroBanners");

app.MapPatch("/api/hero-banners/{id:int}/toggle", [Authorize] async (int id, AppDbContext db) =>
{
    var banner = await db.HeroBanners.FindAsync(id);
    if (banner == null) return Results.NotFound();
    banner.IsActive = !banner.IsActive;
    banner.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { banner.Id, banner.IsActive });
}).WithName("ToggleHeroBanner").WithTags("HeroBanners");

// Content Pages
app.MapGet("/api/pages", async (AppDbContext db) =>
    Results.Ok(await db.ContentPages
        .Where(p => p.IsPublished)
        .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
        .Select(p => new { p.Id, p.Slug, p.TitleZhTW, p.SortOrder })
        .ToListAsync()))
.WithName("GetContentPages").WithTags("ContentPages");

app.MapGet("/api/pages/all", [Authorize] async (AppDbContext db) =>
    Results.Ok(await db.ContentPages
        .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
        .Select(p => new { p.Id, p.Slug, p.TitleZhTW, p.BodyZhTW, p.IsPublished, p.SortOrder, p.CreatedAt, p.UpdatedAt })
        .ToListAsync()))
.WithName("GetAllContentPages").WithTags("ContentPages");

app.MapGet("/api/pages/{slug}", async (string slug, AppDbContext db) =>
{
    var page = await db.ContentPages
        .Where(p => p.Slug == slug && p.IsPublished)
        .Select(p => new { p.Id, p.Slug, p.TitleZhTW, p.BodyZhTW, p.SortOrder, p.UpdatedAt })
        .FirstOrDefaultAsync();
    return page == null ? Results.NotFound() : Results.Ok(page);
}).WithName("GetContentPageBySlug").WithTags("ContentPages");

app.MapPost("/api/pages", [Authorize] async ([FromBody] UpsertContentPageRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Slug)) return Results.BadRequest(new { Message = "Slug 不可為空" });
    if (string.IsNullOrEmpty(req.TitleZhTW)) return Results.BadRequest(new { Message = "標題不可為空" });
    if (await db.ContentPages.AnyAsync(p => p.Slug == req.Slug))
        return Results.Conflict(new { Message = "Slug 已存在" });
    var page = new ContentPage
    {
        Slug = req.Slug.Trim().ToLower(),
        TitleZhTW = req.TitleZhTW,
        BodyZhTW = req.BodyZhTW ?? "",
        IsPublished = req.IsPublished ?? true,
        SortOrder = req.SortOrder ?? 0,
        CreatedAt = DateTime.UtcNow
    };
    db.ContentPages.Add(page);
    await db.SaveChangesAsync();
    return Results.Created($"/api/pages/{page.Slug}", new { page.Id, page.Slug });
}).WithName("CreateContentPage").WithTags("ContentPages");

app.MapPut("/api/pages/{id:int}", [Authorize] async (int id, [FromBody] UpsertContentPageRequest req, AppDbContext db) =>
{
    var page = await db.ContentPages.FindAsync(id);
    if (page == null) return Results.NotFound();
    if (!string.IsNullOrEmpty(req.TitleZhTW)) page.TitleZhTW = req.TitleZhTW;
    if (req.BodyZhTW != null) page.BodyZhTW = req.BodyZhTW;
    if (req.IsPublished.HasValue) page.IsPublished = req.IsPublished.Value;
    if (req.SortOrder.HasValue) page.SortOrder = req.SortOrder.Value;
    page.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { page.Id, page.Slug });
}).WithName("UpdateContentPage").WithTags("ContentPages");

app.MapDelete("/api/pages/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var page = await db.ContentPages.FindAsync(id);
    if (page == null) return Results.NotFound();
    db.ContentPages.Remove(page);
    await db.SaveChangesAsync();
    return Results.Ok(new { Message = "頁面已刪除" });
}).WithName("DeleteContentPage").WithTags("ContentPages");

app.MapPatch("/api/pages/{id:int}/toggle", [Authorize] async (int id, AppDbContext db) =>
{
    var page = await db.ContentPages.FindAsync(id);
    if (page == null) return Results.NotFound();
    page.IsPublished = !page.IsPublished;
    page.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { page.Id, page.IsPublished });
}).WithName("ToggleContentPage").WithTags("ContentPages");

// ── 社群爬蟲 OG Meta Endpoint ──────────────────────────────────────────────
// FB/LINE/Telegram 等爬蟲不執行 JavaScript，需要後端直接回傳含 OG tags 的 HTML
// Nginx 偵測到社群 User-Agent 時 proxy 到此 endpoint
app.MapGet("/api/meta/products/{id:int}", async (int id, AppDbContext db, IConfiguration config) =>
{
    var p = await db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id);
    if (p == null) return Results.NotFound();

    var domain = config["AppDomain"] ?? "https://pinhung.com";
    var imageUrl = string.IsNullOrEmpty(p.ImageUrl)
        ? $"{domain}/uploads/og-cover.jpg"
        : (p.ImageUrl.StartsWith("http") ? p.ImageUrl : $"{domain}{p.ImageUrl}");
    var description = !string.IsNullOrEmpty(p.ShortDescription) ? p.ShortDescription
        : (!string.IsNullOrEmpty(p.Description) ? p.Description[..Math.Min(160, p.Description.Length)] : "品皇咖啡精選優質咖啡豆，品質保證。");
    var title = $"{p.Name} | 品皇咖啡";
    var url = $"{domain}/products/{p.Id}";

    var html = $"""
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8" />
          <title>{System.Net.WebUtility.HtmlEncode(title)}</title>
          <meta name="description" content="{System.Net.WebUtility.HtmlEncode(description)}" />
          <meta property="og:type" content="product" />
          <meta property="og:site_name" content="品皇咖啡" />
          <meta property="og:title" content="{System.Net.WebUtility.HtmlEncode(title)}" />
          <meta property="og:description" content="{System.Net.WebUtility.HtmlEncode(description)}" />
          <meta property="og:image" content="{imageUrl}" />
          <meta property="og:url" content="{url}" />
          <meta property="og:locale" content="zh_TW" />
          <meta property="product:price:amount" content="{p.Price}" />
          <meta property="product:price:currency" content="TWD" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{System.Net.WebUtility.HtmlEncode(title)}" />
          <meta name="twitter:description" content="{System.Net.WebUtility.HtmlEncode(description)}" />
          <meta name="twitter:image" content="{imageUrl}" />
          <link rel="canonical" href="{url}" />
          <meta http-equiv="refresh" content="0;url={url}" />
        </head>
        <body>
          <p>正在跳轉到商品頁面... <a href="{url}">{System.Net.WebUtility.HtmlEncode(p.Name)}</a></p>
        </body>
        </html>
        """;

    return Results.Content(html, "text/html; charset=utf-8");
}).WithName("GetProductMetaHtml").WithTags("Meta");

// ── Customer Auth ─────────────────────────────────────────────────────────────

string GenerateCustomerJwt(Customer customer)
{
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, customer.Id.ToString()),
        new Claim(ClaimTypes.Email, customer.Email),
        new Claim(ClaimTypes.Name, customer.Name),
        new Claim(ClaimTypes.Role, "customer"),
    };
    var token = new JwtSecurityToken(
        issuer: jwtIssuer, audience: jwtAudience, claims: claims,
        expires: DateTime.UtcNow.AddDays(30), signingCredentials: creds);
    return new JwtSecurityTokenHandler().WriteToken(token);
}

// POST /api/auth/customer/register — 手機 or Email 註冊
app.MapPost("/api/auth/customer/register", async ([FromBody] CustomerRegisterRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Phone)) return Results.BadRequest(new { message = "請填寫手機號碼" });
    if (string.IsNullOrEmpty(req.Password) || req.Password.Length < 6)
        return Results.BadRequest(new { message = "密碼長度至少 6 碼" });
    if (await db.Customers.AnyAsync(c => c.Phone == req.Phone && c.IsEmailVerified))
        return Results.Conflict(new { message = "此手機號碼已註冊" });

    var cnt = await db.Customers.CountAsync();
    var c = new Customer
    {
        CustomerNumber = $"C{cnt + 1:00000}",
        Name = req.Name ?? req.Phone,
        Email = $"phone_{req.Phone}@noemail.local",
        Phone = req.Phone,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
        IsEmailVerified = true,
        CreatedAt = DateTime.UtcNow
    };
    db.Customers.Add(c);
    await db.SaveChangesAsync();

    var jwt = GenerateCustomerJwt(c);
    var isProfileComplete = !string.IsNullOrEmpty(c.Name) && !string.IsNullOrEmpty(c.Phone) && !string.IsNullOrEmpty(c.Address);
    return Results.Ok(new { token = jwt, customer = new { c.Id, c.Name, c.Email, c.Phone, c.Address, isProfileComplete } });
}).WithName("CustomerRegister").WithTags("CustomerAuth");

// POST /api/auth/customer/verify-otp — 驗證 OTP，建立正式帳號
app.MapPost("/api/auth/customer/verify-otp", async ([FromBody] CustomerVerifyOtpRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Code))
        return Results.BadRequest(new { message = "Email 和驗證碼不可為空" });

    var otp = await db.CustomerOtps
        .Where(o => o.Email == req.Email && o.Code == req.Code && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
        .OrderByDescending(o => o.CreatedAt)
        .FirstOrDefaultAsync();

    if (otp == null) return Results.BadRequest(new { message = "驗證碼錯誤或已過期" });

    otp.IsUsed = true;

    var customer = await db.Customers.FirstOrDefaultAsync(c => c.Email == req.Email);
    if (customer == null) return Results.BadRequest(new { message = "找不到帳號，請重新註冊" });

    customer.IsEmailVerified = true;
    customer.LastLoginAt = DateTime.UtcNow;
    customer.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    var token = GenerateCustomerJwt(customer);
    var isProfileComplete = !string.IsNullOrEmpty(customer.Name) && !string.IsNullOrEmpty(customer.Phone) && !string.IsNullOrEmpty(customer.Address);
    return Results.Ok(new
    {
        token,
        customer = new { customer.Id, customer.Name, customer.Email, customer.Phone, customer.Address, isProfileComplete }
    });
}).WithName("CustomerVerifyOtp").WithTags("CustomerAuth");

// POST /api/auth/customer/login — 手機 + 密碼登入
app.MapPost("/api/auth/customer/login", async ([FromBody] CustomerLoginRequest req, AppDbContext db) =>
{
    if (string.IsNullOrEmpty(req.Password)) return Results.BadRequest(new { message = "密碼不可為空" });
    if (string.IsNullOrEmpty(req.Phone))
        return Results.BadRequest(new { message = "請輸入手機號碼" });

    var customer = await db.Customers.FirstOrDefaultAsync(c => c.Phone == req.Phone && c.IsEmailVerified);

    if (customer == null || string.IsNullOrEmpty(customer.PasswordHash))
        return Results.Unauthorized();
    if (!BCrypt.Net.BCrypt.Verify(req.Password, customer.PasswordHash))
        return Results.Unauthorized();
    if (!customer.IsEmailVerified)
        return Results.BadRequest(new { message = "帳號尚未驗證，請先完成 Email 驗證" });

    customer.LastLoginAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    var token = GenerateCustomerJwt(customer);
    var isProfileComplete = !string.IsNullOrEmpty(customer.Name) && !string.IsNullOrEmpty(customer.Phone) && !string.IsNullOrEmpty(customer.Address);
    return Results.Ok(new
    {
        token,
        customer = new { customer.Id, customer.Name, customer.Email, customer.Phone, customer.Address, isProfileComplete }
    });
}).WithName("CustomerLogin").WithTags("CustomerAuth");

// GET /api/auth/customer/google-url — 取得 Google OAuth URL
app.MapGet("/api/auth/customer/google-url", (IConfiguration config) =>
{
    var googleConfig = config.GetSection("GoogleLogin");
    var clientId = googleConfig["ClientId"] ?? "";
    var redirectUri = googleConfig["RedirectUri"] ?? "";
    var state = Guid.NewGuid().ToString("N");
    var scope = Uri.EscapeDataString("openid email profile");
    var url = $"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={clientId}&redirect_uri={Uri.EscapeDataString(redirectUri)}&state={state}&scope={scope}&access_type=offline&prompt=select_account";
    return Results.Ok(new { url, state });
}).WithName("CustomerGoogleUrl").WithTags("CustomerAuth");

// GET /api/auth/customer/google/callback — Google OAuth callback
app.MapGet("/api/auth/customer/google/callback", async (string code, string state, AppDbContext db, IConfiguration config) =>
{
    var googleConfig = config.GetSection("GoogleLogin");
    var clientId = googleConfig["ClientId"] ?? "";
    var clientSecret = googleConfig["ClientSecret"] ?? "";
    var redirectUri = googleConfig["RedirectUri"] ?? "";
    var frontendBase = config["AppDomain"] ?? "http://localhost:5173";

    string googleSub, email, name;
    try
    {
        using var http = new System.Net.Http.HttpClient();

        // 換 access token
        var tokenResp = await http.PostAsync("https://oauth2.googleapis.com/token",
            new System.Net.Http.FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = redirectUri,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret
            }));
        var tokenJson = await tokenResp.Content.ReadAsStringAsync();
        using var tokenDoc = System.Text.Json.JsonDocument.Parse(tokenJson);
        if (tokenDoc.RootElement.TryGetProperty("error", out var errEl))
            throw new Exception(errEl.GetString() ?? "Token exchange failed");

        var idToken = tokenDoc.RootElement.GetProperty("id_token").GetString() ?? "";

        // 解析 id_token（Base64URL decode payload）
        var parts = idToken.Split('.');
        var payload = parts[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        var payloadJson = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payload));
        using var payloadDoc = System.Text.Json.JsonDocument.Parse(payloadJson);
        googleSub = payloadDoc.RootElement.GetProperty("sub").GetString() ?? throw new Exception("Missing sub");
        email = payloadDoc.RootElement.GetProperty("email").GetString() ?? throw new Exception("Missing email");
        name = payloadDoc.RootElement.TryGetProperty("name", out var n)
            ? (n.GetString() ?? email.Split('@')[0])
            : email.Split('@')[0];
    }
    catch (Exception ex)
    {
        return Results.Redirect($"{frontendBase}/auth/callback?error={Uri.EscapeDataString(ex.Message)}");
    }

    var customer = await db.Customers.FirstOrDefaultAsync(c => c.GoogleId == googleSub)
        ?? await db.Customers.FirstOrDefaultAsync(c => c.Email == email);

    bool isNew = customer == null;
    if (customer == null)
    {
        var cnt = await db.Customers.CountAsync();
        customer = new Customer
        {
            CustomerNumber = $"C{cnt + 1:00000}",
            Name = name, Email = email, Phone = "",
            PasswordHash = "", GoogleId = googleSub,
            IsEmailVerified = true, CreatedAt = DateTime.UtcNow
        };
        db.Customers.Add(customer);
    }
    else
    {
        if (string.IsNullOrEmpty(customer.GoogleId)) customer.GoogleId = googleSub;
        customer.UpdatedAt = DateTime.UtcNow;
    }
    customer.LastLoginAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    var jwt = GenerateCustomerJwt(customer);
    return Results.Redirect($"{frontendBase}/auth/callback?token={jwt}&isNew={isNew.ToString().ToLower()}");
}).WithName("CustomerGoogleCallback").WithTags("CustomerAuth");

// GET /api/auth/customer/line-url — 取得 LINE Auth URL
app.MapGet("/api/auth/customer/line-url", (IConfiguration config) =>
{
    var lineConfig = config.GetSection("LineLogin");
    var channelId = lineConfig["ChannelId"] ?? "";
    var redirectUri = lineConfig["RedirectUri"] ?? "";
    var state = Guid.NewGuid().ToString("N");
    var url = $"https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={channelId}&redirect_uri={Uri.EscapeDataString(redirectUri)}&state={state}&scope=profile%20openid%20email";
    return Results.Ok(new { url, state });
}).WithName("CustomerLineUrl").WithTags("CustomerAuth");

// GET /api/auth/customer/line/callback — LINE OAuth callback
app.MapGet("/api/auth/customer/line/callback", async (string code, string state, AppDbContext db, IConfiguration config) =>
{
    var lineConfig = config.GetSection("LineLogin");
    var channelId = lineConfig["ChannelId"] ?? "";
    var channelSecret = lineConfig["ChannelSecret"] ?? "";
    var redirectUri = lineConfig["RedirectUri"] ?? "";
    var frontendBase = config["AppDomain"] ?? "http://localhost:5173";

    // 換 access token
    using var http = new System.Net.Http.HttpClient();
    var tokenResp = await http.PostAsync("https://api.line.me/oauth2/v2.1/token",
        new System.Net.Http.FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = redirectUri,
            ["client_id"] = channelId,
            ["client_secret"] = channelSecret
        }));

    var tokenJson = await tokenResp.Content.ReadAsStringAsync();
    string lineId, lineEmail, lineName;
    try
    {
        using var doc = System.Text.Json.JsonDocument.Parse(tokenJson);
        var accessToken = doc.RootElement.GetProperty("access_token").GetString() ?? "";

        // 取 profile
        using var profReq = new System.Net.Http.HttpRequestMessage(System.Net.Http.HttpMethod.Get, "https://api.line.me/v2/profile");
        profReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        var profResp = await http.SendAsync(profReq);
        var profJson = await profResp.Content.ReadAsStringAsync();
        using var profDoc = System.Text.Json.JsonDocument.Parse(profJson);
        lineId = profDoc.RootElement.GetProperty("userId").GetString() ?? throw new Exception("Missing userId");
        lineName = profDoc.RootElement.TryGetProperty("displayName", out var dn) ? (dn.GetString() ?? "會員") : "會員";

        // email 從 id_token 取（若有 openid scope）
        lineEmail = "";
        if (doc.RootElement.TryGetProperty("id_token", out var idTokenEl))
        {
            var idToken = idTokenEl.GetString() ?? "";
            var parts = idToken.Split('.');
            if (parts.Length >= 2)
            {
                var payload = parts[1];
                // Base64URL → 標準 Base64
                payload = payload.Replace('-', '+').Replace('_', '/');
                payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
                var payloadJson = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payload));
                using var payloadDoc = System.Text.Json.JsonDocument.Parse(payloadJson);
                if (payloadDoc.RootElement.TryGetProperty("email", out var emailEl))
                    lineEmail = emailEl.GetString() ?? "";
            }
        }
        if (string.IsNullOrEmpty(lineEmail)) lineEmail = $"{lineId}@line.user";
    }
    catch (Exception ex)
    {
        return Results.Redirect($"{frontendBase}/auth/callback?error={Uri.EscapeDataString(ex.Message)}");
    }

    var customer = await db.Customers.FirstOrDefaultAsync(c => c.LineId == lineId)
        ?? await db.Customers.FirstOrDefaultAsync(c => c.Email == lineEmail);

    bool isNew = customer == null;
    if (customer == null)
    {
        var cnt = await db.Customers.CountAsync();
        customer = new Customer
        {
            CustomerNumber = $"C{cnt + 1:00000}",
            Name = lineName,
            Email = lineEmail,
            Phone = "",
            PasswordHash = "",
            LineId = lineId,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Customers.Add(customer);
    }
    else
    {
        if (string.IsNullOrEmpty(customer.LineId)) customer.LineId = lineId;
        customer.UpdatedAt = DateTime.UtcNow;
    }
    customer.LastLoginAt = DateTime.UtcNow;
    await db.SaveChangesAsync();

    var jwt = GenerateCustomerJwt(customer);
    return Results.Redirect($"{frontendBase}/auth/callback?token={jwt}&isNew={isNew.ToString().ToLower()}");
}).WithName("CustomerLineCallback").WithTags("CustomerAuth");

// GET /api/customer/me — 取得登入客戶個人資料
app.MapGet("/api/customer/me", async (ClaimsPrincipal user, AppDbContext db) =>
{
    var role = user.FindFirstValue(ClaimTypes.Role);
    if (role != "customer") return Results.Forbid();
    var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idStr, out var id)) return Results.Unauthorized();
    var customer = await db.Customers.FindAsync(id);
    if (customer == null || !customer.IsActive) return Results.Unauthorized();
    var isProfileComplete = !string.IsNullOrEmpty(customer.Name) && !string.IsNullOrEmpty(customer.Phone) && !string.IsNullOrEmpty(customer.Address);
    return Results.Ok(new
    {
        customer.Id, customer.Name, customer.Email, customer.Phone, customer.Address,
        customer.CustomerNumber, customer.RegisteredAt, isProfileComplete
    });
}).RequireAuthorization().WithName("CustomerGetMe").WithTags("CustomerAuth");

// PUT /api/customer/me — 更新個人資料
app.MapPut("/api/customer/me", async (ClaimsPrincipal user, [FromBody] CustomerUpdateProfileRequest req, AppDbContext db) =>
{
    var role = user.FindFirstValue(ClaimTypes.Role);
    if (role != "customer") return Results.Forbid();
    var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idStr, out var id)) return Results.Unauthorized();
    var customer = await db.Customers.FindAsync(id);
    if (customer == null || !customer.IsActive) return Results.Unauthorized();
    if (!string.IsNullOrEmpty(req.Name)) customer.Name = req.Name;
    if (!string.IsNullOrEmpty(req.Phone)) customer.Phone = req.Phone;
    if (req.Address != null) customer.Address = req.Address;
    customer.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    var isProfileComplete = !string.IsNullOrEmpty(customer.Name) && !string.IsNullOrEmpty(customer.Phone) && !string.IsNullOrEmpty(customer.Address);
    return Results.Ok(new { customer.Id, customer.Name, customer.Email, customer.Phone, customer.Address, isProfileComplete });
}).RequireAuthorization().WithName("CustomerUpdateProfile").WithTags("CustomerAuth");

// GET /api/orders/lookup — 匿名訂單查詢（訂單編號 + Email 雙重驗證）
app.MapGet("/api/orders/lookup", async ([FromQuery] string orderNumber, [FromQuery] string email, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(orderNumber) || string.IsNullOrWhiteSpace(email))
        return Results.BadRequest(new { message = "請提供訂單編號與 Email" });
    var order = await db.Orders.Include(o => o.Items)
        .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
    if (order == null) return Results.NotFound(new { message = "找不到此訂單" });
    // 用 Customer Email 驗證（避免任意查他人訂單）
    var customer = await db.Customers.FindAsync(order.CustomerId);
    if (customer == null || !string.Equals(customer.Email, email.Trim(), StringComparison.OrdinalIgnoreCase))
        return Results.NotFound(new { message = "找不到此訂單" });
    return Results.Ok(new
    {
        order.Id, order.OrderNumber, order.TotalAmount, order.Subtotal, order.ShippingFee, order.DiscountAmount,
        Status = order.Status.ToString(),
        PaymentStatus = order.PaymentStatus.ToString(),
        PaymentMethod = order.PaymentMethod.ToString(),
        order.RecipientName, order.RecipientPhone, order.ShippingAddress,
        order.Notes, order.TransferCode,
        order.OrderDate, order.CreatedAt,
        Items = order.Items.Select(i => new
        {
            i.ProductName, i.ProductSku, i.UnitPrice, i.Quantity, i.Subtotal
        })
    });
}).WithName("OrderLookup").WithTags("Orders");

// GET /api/customer/orders — 查詢自己的訂單列表
app.MapGet("/api/customer/orders", async (ClaimsPrincipal user, AppDbContext db,
    [FromQuery] int page = 1, [FromQuery] int pageSize = 10) =>
{
    var role = user.FindFirstValue(ClaimTypes.Role);
    if (role != "customer") return Results.Forbid();
    var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idStr, out var customerId)) return Results.Unauthorized();
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 50) pageSize = 10;
    var query = db.Orders.Where(o => o.CustomerId == customerId);
    var total = await query.CountAsync();
    var orders = await query.OrderByDescending(o => o.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize)
        .Select(o => new
        {
            o.Id, o.OrderNumber, o.TotalAmount,
            Status = o.Status.ToString(),
            PaymentStatus = o.PaymentStatus.ToString(),
            PaymentMethod = o.PaymentMethod.ToString(),
            o.RecipientName, o.ShippingAddress,
            o.OrderDate, o.CreatedAt,
            ItemCount = o.Items.Count
        }).ToListAsync();
    return Results.Ok(new { data = orders, page, pageSize, totalCount = total,
        totalPages = (int)Math.Ceiling((double)total / pageSize) });
}).RequireAuthorization().WithName("CustomerGetOrders").WithTags("CustomerAuth");

// GET /api/customer/orders/{id} — 查詢自己的訂單詳情
app.MapGet("/api/customer/orders/{id:int}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
{
    var role = user.FindFirstValue(ClaimTypes.Role);
    if (role != "customer") return Results.Forbid();
    var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idStr, out var customerId)) return Results.Unauthorized();
    var order = await db.Orders.Include(o => o.Items)
        .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId);
    if (order == null) return Results.NotFound();
    return Results.Ok(new
    {
        order.Id, order.OrderNumber, order.TotalAmount, order.Subtotal, order.ShippingFee, order.DiscountAmount,
        Status = order.Status.ToString(),
        PaymentStatus = order.PaymentStatus.ToString(),
        PaymentMethod = order.PaymentMethod.ToString(),
        order.RecipientName, order.RecipientPhone, order.ShippingAddress,
        order.Notes, order.TransferCode,
        order.OrderDate, order.CreatedAt,
        Items = order.Items.Select(i => new
        {
            i.ProductId, i.ProductName, i.ProductSku, i.UnitPrice, i.Quantity, i.Subtotal
        })
    });
}).RequireAuthorization().WithName("CustomerGetOrderById").WithTags("CustomerAuth");

// PATCH /api/customer/orders/{id}/cancel — 會員取消自己的未付款訂單
app.MapPatch("/api/customer/orders/{id:int}/cancel", async (int id, ClaimsPrincipal user, AppDbContext db) =>
{
    var role = user.FindFirstValue(ClaimTypes.Role);
    if (role != "customer") return Results.Forbid();
    var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idStr, out var customerId)) return Results.Unauthorized();
    var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId);
    if (order == null) return Results.NotFound(new { message = "找不到此訂單" });
    if (order.PaymentStatus != PaymentStatus.Unpaid)
        return Results.BadRequest(new { message = "已付款的訂單無法取消，請聯絡店家申請退款" });
    if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Completed)
        return Results.BadRequest(new { message = "訂單已出貨，無法取消" });
    order.Status = OrderStatus.Cancelled;
    order.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "訂單已取消" });
}).RequireAuthorization().WithName("CustomerCancelOrder").WithTags("CustomerAuth");

// POST /api/orders/lookup/cancel — 匿名取消訂單（訂單編號 + Email 驗證）
app.MapPost("/api/orders/lookup/cancel", async ([FromBody] OrderLookupCancelRequest req, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.OrderNumber) || string.IsNullOrWhiteSpace(req.Email))
        return Results.BadRequest(new { message = "請提供訂單編號與 Email" });
    var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderNumber == req.OrderNumber);
    if (order == null) return Results.NotFound(new { message = "找不到此訂單" });
    var customer = await db.Customers.FindAsync(order.CustomerId);
    if (customer == null || !string.Equals(customer.Email, req.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        return Results.NotFound(new { message = "找不到此訂單" });
    if (order.PaymentStatus != PaymentStatus.Unpaid)
        return Results.BadRequest(new { message = "已付款的訂單無法取消，請聯絡店家申請退款" });
    if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Completed)
        return Results.BadRequest(new { message = "訂單已出貨，無法取消" });
    order.Status = OrderStatus.Cancelled;
    order.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "訂單已取消" });
}).WithName("OrderLookupCancel").WithTags("Orders");

// ── Machine Plans ───────────────────────────────────────────────────────────────

app.MapGet("/api/admin/machine-plans", [Authorize] async (AppDbContext db) =>
{
    var plans = await db.MachinePlans
        .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
        .Select(p => new {
            p.Id, p.Name, p.Category, p.Description,
            p.MonthlyPrice, p.QuarterlyPrice, p.AnnualPrice, p.DepositAmount,
            p.Features, p.IsActive, p.SortOrder, p.CreatedAt, p.UpdatedAt
        }).ToListAsync();
    return Results.Ok(plans);
}).WithName("GetMachinePlans").WithTags("MachinePlans");

app.MapPost("/api/admin/machine-plans", [Authorize] async ([FromBody] UpsertMachinePlanRequest req, AppDbContext db) =>
{
    var plan = new MachinePlan
    {
        Name = req.Name.Trim(),
        Category = req.Category ?? "office",
        Description = req.Description?.Trim(),
        MonthlyPrice = req.MonthlyPrice,
        QuarterlyPrice = req.QuarterlyPrice,
        AnnualPrice = req.AnnualPrice,
        DepositAmount = req.DepositAmount,
        Features = req.Features,
        IsActive = req.IsActive ?? true,
        SortOrder = req.SortOrder ?? 0,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };
    db.MachinePlans.Add(plan);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admin/machine-plans/{plan.Id}", plan);
}).WithName("CreateMachinePlan").WithTags("MachinePlans");

app.MapPut("/api/admin/machine-plans/{id:int}", [Authorize] async (int id, [FromBody] UpsertMachinePlanRequest req, AppDbContext db) =>
{
    var plan = await db.MachinePlans.FindAsync(id);
    if (plan == null) return Results.NotFound();
    plan.Name = req.Name.Trim();
    plan.Category = req.Category ?? plan.Category;
    plan.Description = req.Description?.Trim();
    plan.MonthlyPrice = req.MonthlyPrice;
    plan.QuarterlyPrice = req.QuarterlyPrice;
    plan.AnnualPrice = req.AnnualPrice;
    plan.DepositAmount = req.DepositAmount;
    plan.Features = req.Features;
    plan.IsActive = req.IsActive ?? plan.IsActive;
    plan.SortOrder = req.SortOrder ?? plan.SortOrder;
    plan.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(plan);
}).WithName("UpdateMachinePlan").WithTags("MachinePlans");

app.MapPatch("/api/admin/machine-plans/{id:int}/toggle", [Authorize] async (int id, AppDbContext db) =>
{
    var plan = await db.MachinePlans.FindAsync(id);
    if (plan == null) return Results.NotFound();
    plan.IsActive = !plan.IsActive;
    plan.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { plan.Id, plan.IsActive });
}).WithName("ToggleMachinePlan").WithTags("MachinePlans");

// ── Business Subscriptions (CRM) ─────────────────────────────────────────────

app.MapGet("/api/admin/subscriptions", [Authorize] async (
    AppDbContext db,
    [FromQuery] string? status,
    [FromQuery] int? planId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 50) =>
{
    var q = db.BusinessSubscriptions.Include(s => s.MachinePlan).AsQueryable();
    if (!string.IsNullOrWhiteSpace(status)) q = q.Where(s => s.Status == status);
    if (planId.HasValue) q = q.Where(s => s.MachinePlanId == planId);
    var total = await q.CountAsync();
    var items = await q.OrderByDescending(s => s.UpdatedAt)
        .Skip((page - 1) * pageSize).Take(pageSize)
        .Select(s => new {
            s.Id, s.ContactName, s.Phone, s.Email, s.Company,
            s.MachinePlanId, PlanName = s.MachinePlan == null ? null : s.MachinePlan.Name,
            s.BillingCycle, s.StartDate, s.RenewalDate, s.Status,
            s.InternalNotes, s.SourceInquiryId, s.CreatedAt, s.UpdatedAt
        }).ToListAsync();
    return Results.Ok(new { data = items, totalCount = total, page, pageSize });
}).WithName("GetSubscriptions").WithTags("Subscriptions");

app.MapGet("/api/admin/subscriptions/{id:int}", [Authorize] async (int id, AppDbContext db) =>
{
    var s = await db.BusinessSubscriptions
        .Include(s => s.MachinePlan)
        .Include(s => s.SourceInquiry)
        .Where(s => s.Id == id).FirstOrDefaultAsync();
    if (s == null) return Results.NotFound();
    return Results.Ok(new {
        s.Id, s.ContactName, s.Phone, s.Email, s.Company,
        s.MachinePlanId, PlanName = s.MachinePlan?.Name,
        s.BillingCycle, s.StartDate, s.RenewalDate, s.Status,
        s.InternalNotes, s.ChangeHistory, s.SourceInquiryId, s.CreatedAt, s.UpdatedAt
    });
}).WithName("GetSubscription").WithTags("Subscriptions");

app.MapPost("/api/admin/subscriptions", [Authorize] async ([FromBody] CreateSubscriptionRequest req, AppDbContext db) =>
{
    var sub = new BusinessSubscription
    {
        ContactName = req.ContactName.Trim(),
        Phone = req.Phone.Trim(),
        Email = req.Email?.Trim(),
        Company = req.Company?.Trim(),
        MachinePlanId = req.MachinePlanId,
        BillingCycle = req.BillingCycle ?? "monthly",
        StartDate = req.StartDate,
        RenewalDate = req.RenewalDate,
        Status = req.Status ?? "pending",
        InternalNotes = req.InternalNotes?.Trim(),
        SourceInquiryId = req.SourceInquiryId,
        ChangeHistory = "[]",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
    };
    db.BusinessSubscriptions.Add(sub);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admin/subscriptions/{sub.Id}", new { sub.Id });
}).WithName("CreateSubscription").WithTags("Subscriptions");

app.MapPatch("/api/admin/subscriptions/{id:int}", [Authorize] async (int id, [FromBody] UpdateSubscriptionRequest req, AppDbContext db) =>
{
    var sub = await db.BusinessSubscriptions.Include(s => s.MachinePlan).FirstOrDefaultAsync(s => s.Id == id);
    if (sub == null) return Results.NotFound();

    // 升降級：記錄歷史
    if (req.MachinePlanId.HasValue && req.MachinePlanId != sub.MachinePlanId)
    {
        var oldPlan = sub.MachinePlan?.Name ?? "無";
        var newPlan = await db.MachinePlans.Where(p => p.Id == req.MachinePlanId).Select(p => p.Name).FirstOrDefaultAsync() ?? "未知";
        var history = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(sub.ChangeHistory ?? "[]") ?? new();
        var entry = System.Text.Json.JsonSerializer.SerializeToElement(new {
            date = DateTime.UtcNow,
            action = "plan_change",
            fromPlan = oldPlan,
            toPlan = newPlan,
            note = req.HistoryNote ?? ""
        });
        history.Add(entry);
        sub.ChangeHistory = System.Text.Json.JsonSerializer.Serialize(history);
        sub.MachinePlanId = req.MachinePlanId;
    }
    if (req.Status != null) sub.Status = req.Status;
    if (req.BillingCycle != null) sub.BillingCycle = req.BillingCycle;
    if (req.StartDate.HasValue) sub.StartDate = req.StartDate;
    if (req.RenewalDate.HasValue) sub.RenewalDate = req.RenewalDate;
    if (req.InternalNotes != null) sub.InternalNotes = req.InternalNotes;
    sub.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "更新成功" });
}).WithName("UpdateSubscription").WithTags("Subscriptions");

// 新增備忘記錄（不換方案，只加一筆 note）
app.MapPost("/api/admin/subscriptions/{id:int}/notes", [Authorize] async (int id, [FromBody] AddNoteRequest req, AppDbContext db) =>
{
    var sub = await db.BusinessSubscriptions.FindAsync(id);
    if (sub == null) return Results.NotFound();
    var history = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(sub.ChangeHistory ?? "[]") ?? new();
    var entry = System.Text.Json.JsonSerializer.SerializeToElement(new {
        date = DateTime.UtcNow,
        action = "note",
        fromPlan = (string?)null,
        toPlan = (string?)null,
        note = req.Note
    });
    history.Add(entry);
    sub.ChangeHistory = System.Text.Json.JsonSerializer.Serialize(history);
    sub.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "備忘已記錄" });
}).WithName("AddSubscriptionNote").WithTags("Subscriptions");

// ── Business Inquiries ──────────────────────────────────────────────────────────

// 公開端點：送出詢問單
app.MapPost("/api/inquiries", async ([FromBody] CreateInquiryRequest req, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(req.ContactName) || string.IsNullOrWhiteSpace(req.Phone))
        return Results.BadRequest(new { message = "姓名與電話為必填" });
    var inquiry = new BusinessInquiry
    {
        ContactName = req.ContactName.Trim(),
        Phone = req.Phone.Trim(),
        Email = req.Email?.Trim(),
        Company = req.Company?.Trim(),
        InquiryType = req.InquiryType ?? "general",
        SelectedPlan = req.SelectedPlan?.Trim(),
        Message = req.Message?.Trim(),
        Status = "new",
        CreatedAt = DateTime.UtcNow,
    };
    db.BusinessInquiries.Add(inquiry);
    await db.SaveChangesAsync();
    return Results.Created($"/api/admin/inquiries/{inquiry.Id}", new { inquiry.Id, message = "詢問單已送出，我們將於 1 個工作日內與您聯繫" });
}).WithName("CreateInquiry").WithTags("Inquiries");

// 後台：列出所有詢問單
app.MapGet("/api/admin/inquiries", [Authorize] async (
    AppDbContext db,
    [FromQuery] string? status,
    [FromQuery] string? type,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 30) =>
{
    var q = db.BusinessInquiries.AsQueryable();
    if (!string.IsNullOrWhiteSpace(status)) q = q.Where(i => i.Status == status);
    if (!string.IsNullOrWhiteSpace(type)) q = q.Where(i => i.InquiryType == type);
    var total = await q.CountAsync();
    var items = await q.OrderByDescending(i => i.CreatedAt)
        .Skip((page - 1) * pageSize).Take(pageSize)
        .Select(i => new
        {
            i.Id, i.ContactName, i.Phone, i.Email, i.Company,
            i.InquiryType, i.SelectedPlan, i.Message,
            i.Status, i.AdminNote, i.CreatedAt, i.UpdatedAt
        }).ToListAsync();
    return Results.Ok(new { data = items, totalCount = total, page, pageSize });
}).WithName("GetInquiries").WithTags("Inquiries");

// 後台：更新狀態與備註
app.MapPatch("/api/admin/inquiries/{id:int}", [Authorize] async (
    int id, [FromBody] UpdateInquiryRequest req, AppDbContext db) =>
{
    var inquiry = await db.BusinessInquiries.FindAsync(id);
    if (inquiry == null) return Results.NotFound();
    if (req.Status != null) inquiry.Status = req.Status;
    if (req.AdminNote != null) inquiry.AdminNote = req.AdminNote;
    inquiry.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "更新成功" });
}).WithName("UpdateInquiry").WithTags("Inquiries");

app.Run();

public record CreateCustomerRequest(string Email, string? Name, string? Phone, string? Address, string? DisplayName, string? FirebaseUid);
public record CreateOrderItemRequest(int ProductId, int Quantity, decimal? Discount);
public record CreateOrderRequest(
    string CustomerEmail,
    string RecipientName,
    string? RecipientPhone,
    string? ShippingAddress,
    List<CreateOrderItemRequest> Items,
    string? PaymentMethod,
    decimal? DiscountAmount,
    string? Notes,
    string? TransferCode);
public record UpdateOrderStatusRequest(string Status, string? PaymentStatus);
public record LoginRequest(string Email, string Password);
public record CreateAdminRequest(string Email, string Password, string Name, string? Role);
public record UpdateAdminRequest(string? Name, string? Role, string? Password, bool? IsActive);
public record UpsertProductRequest(
    string? Sku, string? Name, string? ShortDescription, string? Description,
    int? CategoryId, decimal? Price, string? Unit, string? ImageUrl,
    bool? IsActive, bool? IsFeatured, bool? IsOrderable, bool? InventoryEnabled, int? SortOrder,
    string? SpecData, string? BulkOptions, string? SubscriptionOptions,
    int? ParentProductId, string? VariantLabel,
    string? PromotionTag, bool? RequirePrePayment, DateTime? PromotionEndAt,
    string? Brand, decimal? OriginalPrice, bool? HasGrindOption);
public record UpdateCategoryRequest(string? Name, string? Description, string? SpecTemplate, string? Icon, int? SortOrder, int? ParentId);
public record CreateCategoryRequest(string Name, string Code, string? Description, string? Icon, string? Color, int? ParentId, int SortOrder, string? SpecTemplate);
public record ProductTogglesRequest(bool? IsOrderable, bool? InventoryEnabled, bool? IsActive, bool? HasGrindOption);
public record BatchProductRequest(List<int> Ids, bool? IsOrderable, bool? IsActive, bool? IsFeatured);
public record SiteSettingItem(string Key, string? Value);
public record ImportRow
{
    public string? Sku { get; set; }
    public string? Name { get; set; }
    public string? CategoryName { get; set; }
    public string? PriceStr { get; set; }
    public string? Unit { get; set; }
    public string? ShortDescription { get; set; }
}
public record UpsertTestimonialRequest(string? Content, string? AuthorName, int Rating, string? ImageUrl, bool? IsVisible, int? SortOrder);
public record UpsertStoreRequest(string? Name, string? Address, string? Phone, string? BusinessHours, string? ImageUrl, bool? IsVisible, int? SortOrder);
public record UpsertHeroBannerRequest(string? Title, string? SubTitle, string? ButtonText, string? ButtonUrl, string? ImageUrl, bool? IsActive, int? SortOrder);
public record UpsertContentPageRequest(string? Slug, string? TitleZhTW, string? BodyZhTW, bool? IsPublished, int? SortOrder);
public record CustomerRegisterRequest(string Phone, string Password, string? Name);
public record CustomerVerifyOtpRequest(string Email, string Code); // 保留供舊有資料相容
public record CustomerLoginRequest(string? Phone, string Password);
public record CustomerUpdateProfileRequest(string? Name, string? Phone, string? Address);
public record OrderLookupCancelRequest(string OrderNumber, string Email);
public record CreateInquiryRequest(
    string ContactName, string Phone, string? Email, string? Company,
    string? InquiryType, string? SelectedPlan, string? Message);
public record UpdateInquiryRequest(string? Status, string? AdminNote);
public record UpsertMachinePlanRequest(
    string Name, string? Category, string? Description,
    decimal? MonthlyPrice, decimal? QuarterlyPrice, decimal? AnnualPrice, decimal? DepositAmount,
    string? Features, bool? IsActive, int? SortOrder);
public record CreateSubscriptionRequest(
    string ContactName, string Phone, string? Email, string? Company,
    int? MachinePlanId, string? BillingCycle,
    DateTime? StartDate, DateTime? RenewalDate, string? Status,
    string? InternalNotes, int? SourceInquiryId);
public record UpdateSubscriptionRequest(
    int? MachinePlanId, string? Status, string? BillingCycle,
    DateTime? StartDate, DateTime? RenewalDate,
    string? InternalNotes, string? HistoryNote);
public record AddNoteRequest(string Note);
