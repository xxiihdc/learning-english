# Apache Solr Docker Setup

This directory contains Docker Compose configuration for running Apache Solr with persistent data storage.

## Quick Start

1. **Setup directories:**
   ```bash
   chmod +x setup-solr.sh
   ./setup-solr.sh
   ```

2. **Start basic Solr:**
   ```bash
   docker compose up -d solr
   ```

3. **Access Solr Admin UI:**
   - Open http://localhost:8983/solr in your browser

## Available Services

### 1. Basic Solr (Default)
- **Port:** 8983
- **Service:** `solr`
- **Data:** Persisted in `./data/solr`
- **Usage:** `docker compose up -d solr`

### 2. Secure Solr (with Authentication)
- **Port:** 8984
- **Service:** `solr-secure`
- **Profile:** `secure`
- **Credentials:** admin/password123
- **Usage:** `docker compose --profile secure up -d solr-secure`

### 3. SolrCloud Cluster (Distributed)
- **Ports:** 8985, 8986 (Solr nodes), 2181 (Zookeeper)
- **Services:** `zookeeper`, `solr-cloud-1`, `solr-cloud-2`
- **Profile:** `cloud`
- **Usage:** `docker compose --profile cloud up -d`

## Data Persistence

All Solr data is stored in the `./data/` directory:
```
data/
├── solr/           # Basic Solr data
├── solr-secure/    # Secure Solr data
├── solr-cloud-1/   # SolrCloud node 1 data
├── solr-cloud-2/   # SolrCloud node 2 data
└── zookeeper/      # Zookeeper data
```

## Configuration

### Custom Configsets
Place custom Solr configsets in `./solr/configsets/`

### Custom Cores
Define custom cores in `./solr/cores/`

### Security Configuration
Security settings are in `./solr/security.json`

## Common Commands

```bash
# Start basic Solr
docker compose up -d solr

# Start with logs
docker compose up solr

# Stop all services
docker compose down

# Remove all data (CAUTION!)
docker compose down -v
rm -rf data/

# View logs
docker compose logs solr

# Create a new core
docker compose exec solr solr create_core -c vocabulary

# Check Solr status
curl http://localhost:8983/solr/admin/cores?action=STATUS
```

## For Learning English App

To integrate with your Learning English app, you can:

1. **Create a vocabulary core:**
   ```bash
   docker compose exec solr solr create_core -c vocabulary
   ```

2. **Index vocabulary data:**
   ```bash
   # Add documents via REST API
   curl -X POST -H 'Content-Type: application/json' \
     'http://localhost:8983/solr/vocabulary/update/json/docs' \
     --data-binary '[
       {
         "id": "1",
         "english": "hello",
         "vietnamese": "xin chào",
         "type": "interjection",
         "phonetic": "/həˈloʊ/"
       }
     ]'
   
   # Commit changes
   curl http://localhost:8983/solr/vocabulary/update?commit=true
   ```

3. **Search vocabulary:**
   ```bash
   curl 'http://localhost:8983/solr/vocabulary/select?q=hello'
   ```

## Troubleshooting

### Permission Issues
```bash
sudo chown -R 8983:8983 data/solr
```

### Memory Issues
Adjust heap size in docker-compose.yml:
```yaml
environment:
  - SOLR_HEAP=1g
  - SOLR_JAVA_MEM=-Xms1g -Xmx1g
```

### Port Conflicts
Change ports in docker-compose.yml if 8983 is already in use.

## Production Considerations

1. **Use external volumes** for better performance
2. **Enable authentication** in production
3. **Configure backup** strategies
4. **Monitor resource usage**
5. **Use SolrCloud** for high availability
