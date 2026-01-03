FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["Finance Tracking.csproj", "./"]
RUN dotnet restore "Finance Tracking.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "Finance Tracking.csproj" -c Release -o /app/build
RUN dotnet publish "Finance Tracking.csproj" -c Release -o /app/publish

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
