# Kafka Configuration for <%= classify(moduleName) %> Module

This directory contains Kafka-related infrastructure configuration for the <%= classify(moduleName) %> module.

## Topics

### Producer Topics
<% if (kafka === 'producer' || kafka === 'both') { %>
- **<%= dasherize(moduleName) %>.created** - Published when a new <%= dasherize(moduleName) %> is created
- **<%= dasherize(moduleName) %>.updated** - Published when a <%= dasherize(moduleName) %> is updated
- **<%= dasherize(moduleName) %>.deleted** - Published when a <%= dasherize(moduleName) %> is deleted
<% } %>

### Consumer Topics
<% if (kafka === 'consumer' || kafka === 'both') { %>
- **external.<%= dasherize(moduleName) %>.events** - Consumes events from external systems
- **<%= dasherize(moduleName) %>.commands** - Consumes commands for <%= dasherize(moduleName) %> operations
<% } %>

## Topic Configuration

### Partitions
- Default: 3 partitions per topic
- Adjust based on expected throughput and parallelism requirements

### Replication Factor
- Development: 1
- Production: 3 (recommended for high availability)

### Retention
- Default: 7 days (168 hours)
- Adjust based on compliance and replay requirements

## Schema Registry
<% if (schemaRegistry === 'confluent') { %>
This module uses Confluent Schema Registry for schema validation.

### Schemas Location
- Avro schemas: `./schemas/*.avsc`
- JSON schemas: `./schemas/*.json`

### Schema Versioning
- Backward compatibility is enforced
- Schema evolution follows semantic versioning
<% } else { %>
Schema registry is not configured. Consider enabling it for production environments.
<% } %>

## Environment Variables

```bash
# Kafka Broker Configuration
KAFKA_BROKERS=localhost:9092

# Consumer Group
KAFKA_CONSUMER_GROUP_<%= dasherize(moduleName).toUpperCase().replace(/-/g, '_') %>=<%= dasherize(moduleName) %>-consumer-group

# Topic Configuration
KAFKA_TOPIC_<%= dasherize(moduleName).toUpperCase().replace(/-/g, '_') %>_CREATED=<%= dasherize(moduleName) %>.created
KAFKA_TOPIC_<%= dasherize(moduleName).toUpperCase().replace(/-/g, '_') %>_UPDATED=<%= dasherize(moduleName) %>.updated
KAFKA_TOPIC_<%= dasherize(moduleName).toUpperCase().replace(/-/g, '_') %>_DELETED=<%= dasherize(moduleName) %>.deleted

<% if (schemaRegistry === 'confluent') { %># Schema Registry
KAFKA_SCHEMA_REGISTRY_URL=http://localhost:8081
<% } %>
# Producer Configuration
KAFKA_PRODUCER_ACKS=all
KAFKA_PRODUCER_COMPRESSION=gzip
KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS=5

# Consumer Configuration
KAFKA_CONSUMER_SESSION_TIMEOUT=30000
KAFKA_CONSUMER_HEARTBEAT_INTERVAL=3000
KAFKA_CONSUMER_AUTO_COMMIT=false
```

## Creating Topics

### Using Kafka CLI

```bash
# Create created event topic
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic <%= dasherize(moduleName) %>.created \
  --partitions 3 \
  --replication-factor 1

# Create updated event topic
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic <%= dasherize(moduleName) %>.updated \
  --partitions 3 \
  --replication-factor 1

# Create deleted event topic
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic <%= dasherize(moduleName) %>.deleted \
  --partitions 3 \
  --replication-factor 1
```

### Using Docker Compose

See `docker-compose.kafka.yml` for automated topic creation.

## Monitoring

### Consumer Lag
Monitor consumer lag to ensure timely message processing:

```bash
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe \
  --group <%= dasherize(moduleName) %>-consumer-group
```

### Topic Metrics
- Messages per second
- Consumer lag
- Partition distribution
- Error rate

## Testing

### Manual Testing with Kafka Console

#### Produce a test message:
```bash
kafka-console-producer --bootstrap-server localhost:9092 \
  --topic <%= dasherize(moduleName) %>.created \
  --property "parse.key=true" \
  --property "key.separator=:"
```

Then enter:
```
test-id:{"eventType":"<%= classify(moduleName) %>Created","eventVersion":"1.0","occurredAt":"2024-01-01T00:00:00Z","payload":{"id":"test-id","name":"Test"}}
```

#### Consume messages:
```bash
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic <%= dasherize(moduleName) %>.created \
  --from-beginning \
  --property print.key=true \
  --property key.separator=:
```

## Troubleshooting

### Consumer Not Receiving Messages
1. Check consumer group is running: `docker ps | grep kafka`
2. Verify topic exists: `kafka-topics --list --bootstrap-server localhost:9092`
3. Check consumer lag (see Monitoring section)
4. Review application logs for errors

### Producer Errors
1. Verify broker connectivity
2. Check topic permissions
3. Validate message format
4. Review producer configuration (acks, timeout, retries)

### Schema Registry Issues
<% if (schemaRegistry === 'confluent') { %>
1. Verify schema registry is running: `curl http://localhost:8081/subjects`
2. Check schema compatibility: `curl http://localhost:8081/compatibility/subjects/<%= dasherize(moduleName) %>.created-value/versions/latest`
3. Review schema evolution rules
<% } else { %>
Schema registry is not configured for this module.
<% } %>

## Best Practices

1. **Idempotency**: Ensure consumers handle duplicate messages gracefully
2. **Error Handling**: Implement dead letter queues for failed messages
3. **Monitoring**: Set up alerts for consumer lag and error rates
4. **Schema Evolution**: Always maintain backward compatibility
5. **Partitioning**: Use entity ID as message key for ordered processing
6. **Retention**: Configure based on compliance and replay requirements
7. **Testing**: Test with various message scenarios including edge cases

## References

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Schema Registry](https://docs.confluent.io/platform/current/schema-registry/index.html)
- [NestJS Kafka](https://docs.nestjs.com/microservices/kafka)
