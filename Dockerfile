# --- Stage 1: Build the jar with Maven ---
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy wrapper + pom first so Docker can cache the dependency layer
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Now copy the source and build
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# --- Stage 2: Slim runtime image ---
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Non-root user
RUN useradd -m spring
USER spring

COPY --from=build /app/target/*.jar app.jar

# Render sets PORT at runtime; app.properties already reads ${PORT:3000}
EXPOSE 3000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
