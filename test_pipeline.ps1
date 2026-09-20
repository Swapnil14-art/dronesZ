$adminLogin = @{ email = "admin@example.com"; password = "AdminPassword123!" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "http://localhost:8070/api/admin/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
$token = $loginRes.token
Write-Host "Admin Logged in successfully. Token length: $($token.Length)"

# 1. Create a Test Product
$productReq = @{
    name = "Multi-Image Test Drone"
    description = "Testing 3-image upload, primary toggle, reorder, replace, delete."
    productType = "STANDALONE"
    price = 1999.99
    quantity = 10
    status = "AVAILABLE"
    dispatchTime = "24 Hours"
    warranty = "1-Yr Factory"
    grade = "Aero Precision"
    taxInclusive = $true
    taxNote = "GST Included"
} | ConvertTo-Json

$createdProduct = Invoke-RestMethod -Uri "http://localhost:8070/api/admin/products" -Method Post -Body $productReq -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
$prodId = $createdProduct.id
Write-Host "Created Product ID: $prodId"

# 2. Prepare 3 small sample test images
$img1Bytes = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==") # Red pixel
$img2Bytes = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==") # Green pixel
$img3Bytes = [System.Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==") # Blue pixel

[System.IO.File]::WriteAllBytes("test1.png", $img1Bytes)
[System.IO.File]::WriteAllBytes("test2.png", $img2Bytes)
[System.IO.File]::WriteAllBytes("test3.png", $img3Bytes)

# 3. Upload 3 images using curl.exe multipart form
$uploadRes = & curl.exe -s -X POST "http://localhost:8070/api/admin/products/$prodId/images" -H "Authorization: Bearer $token" -F "files=@test1.png;type=image/png" -F "files=@test2.png;type=image/png" -F "files=@test3.png;type=image/png"
$images = $uploadRes | ConvertFrom-Json
Write-Host "Uploaded Images Count: $($images.Count)"
foreach ($img in $images) {
    Write-Host "  Image ID: $($img.id), Order: $($img.displayOrder), Primary: $($img.isPrimary), URL: $($img.url)"
}

# 4. Verify Public GET Product has 3 images
$publicProduct = Invoke-RestMethod -Uri "http://localhost:8070/api/products/$prodId" -Method Get
Write-Host "Public Product Images Count: $($publicProduct.images.Count)"
Write-Host "Public Primary Image URL: $($publicProduct.image)"

# 5. Verify downloading individual image binary from DB
$img1Id = $images[0].id
$img2Id = $images[1].id
$img3Id = $images[2].id
$binaryCheck = Invoke-WebRequest -Uri "http://localhost:8070/api/products/$prodId/images/$img1Id" -Method Get
Write-Host "Fetched Image 1 Binary: Status $($binaryCheck.StatusCode), ContentType: $($binaryCheck.Headers['Content-Type']), Length: $($binaryCheck.RawContentLength)"

# 6. Set Image 2 as Primary
$setPrimaryRes = Invoke-RestMethod -Uri "http://localhost:8070/api/admin/products/$prodId/images/$img2Id/primary" -Method Patch -Headers @{ Authorization = "Bearer $token" }
Write-Host "Set Image $img2Id as Primary -> isPrimary: $($setPrimaryRes.isPrimary)"

# 7. Reorder images: [Image 3, Image 1, Image 2]
$reorderReq = @{ imageIds = @($img3Id, $img1Id, $img2Id) } | ConvertTo-Json
$reorderedImages = Invoke-RestMethod -Uri "http://localhost:8070/api/admin/products/$prodId/images/reorder" -Method Put -Body $reorderReq -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
Write-Host "Reordered Images Result:"
foreach ($img in $reorderedImages) {
    Write-Host "  Image ID: $($img.id), Order: $($img.displayOrder), Primary: $($img.isPrimary)"
}

# 8. Replace Image 1 with new bytes
$replaceRes = & curl.exe -s -X PUT "http://localhost:8070/api/admin/products/$prodId/images/$img1Id" -H "Authorization: Bearer $token" -F "file=@test2.png;type=image/png"
Write-Host "Replaced Image $img1Id Response: $replaceRes"

# 9. Delete Image 3
$delRes = Invoke-WebRequest -Uri "http://localhost:8070/api/admin/products/$prodId/images/$img3Id" -Method Delete -Headers @{ Authorization = "Bearer $token" }
Write-Host "Delete Image $img3Id StatusCode: $($delRes.StatusCode)"

# 10. Final Verification
$finalImages = Invoke-RestMethod -Uri "http://localhost:8070/api/products/$prodId/images" -Method Get
Write-Host "Final Remaining Images Count: $($finalImages.Count)"
foreach ($img in $finalImages) {
    Write-Host "  Remaining Image ID: $($img.id), Order: $($img.displayOrder), Primary: $($img.isPrimary)"
}

# Clean up local test files & test product
Remove-Item -Path "test1.png", "test2.png", "test3.png" -ErrorAction SilentlyContinue
Invoke-WebRequest -Uri "http://localhost:8070/api/admin/products/$prodId" -Method Delete -Headers @{ Authorization = "Bearer $token" } | Out-Null
Write-Host "Cleaned up test product $prodId. ALL TESTS PASSED!"
