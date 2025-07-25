#!/bin/bash

# Setup script for Apache Solr with Docker Compose

echo "Setting up Apache Solr environment..."

# Create data directories
mkdir -p data/solr
mkdir -p data/solr-secure
mkdir -p data/solr-cloud-1
mkdir -p data/solr-cloud-2
mkdir -p data/zookeeper/data
mkdir -p data/zookeeper/logs

# Create Solr configuration directories
mkdir -p solr/configsets
mkdir -p solr/cores
mkdir -p solr/security

# Set proper permissions
chmod -R 755 data/
chmod -R 755 solr/

echo "Directory structure created:"
echo "data/"
echo "├── solr/"
echo "├── solr-secure/"
echo "├── solr-cloud-1/"
echo "├── solr-cloud-2/"
echo "└── zookeeper/"
echo "    ├── data/"
echo "    └── logs/"
echo ""
echo "solr/"
echo "├── configsets/"
echo "├── cores/"
echo "└── security/"

echo ""
echo "Setup complete! You can now run:"
echo ""
echo "# Start basic Solr:"
echo "docker-compose up solr"
echo ""
echo "# Start Solr with security:"
echo "docker-compose --profile secure up solr-secure"
echo ""
echo "# Start SolrCloud cluster:"
echo "docker-compose --profile cloud up"
echo ""
echo "# Access Solr Admin UI:"
echo "http://localhost:8983/solr"
