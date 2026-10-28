# Build stage using Maven and Eclipse Temurin Java 8
FROM maven:3.9.6-eclipse-temurin-8 AS build
WORKDIR /app

# Cache dependency layers
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build package
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage using Eclipse Temurin JRE 8
FROM eclipse-temurin:8-jre
WORKDIR /app

# Copy built artifact from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8070 10000

ENV MALLOC_ARENA_MAX=2

# Launch application with strictly budgeted 512MB RAM container memory limits and bind directly to Render's $PORT
ENTRYPOINT ["sh", "-c", "java -Xms64m -Xmx192m -Xss384k -XX:MaxMetaspaceSize=96m -XX:ReservedCodeCacheSize=24m -XX:CompressedClassSpaceSize=24m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom -jar app.jar --server.port=${PORT:-8070}"]
