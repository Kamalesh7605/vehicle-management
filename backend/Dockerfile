# ---- build ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- run ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/quarkus-app/ ./
RUN mkdir -p /data/uploads
ENV STORAGE_DIR=/data/uploads
EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]
