FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything
COPY . .

# List files for debugging
RUN ls -la

# Restore, build and publish using wildcard to find .csproj
RUN dotnet restore *.csproj
RUN dotnet build *.csproj -c Release -o /app/build
RUN dotnet publish *.csproj -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 5235

# Set environment to Production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5235

ENTRYPOINT ["dotnet", "Finance Tracking.dll"]
