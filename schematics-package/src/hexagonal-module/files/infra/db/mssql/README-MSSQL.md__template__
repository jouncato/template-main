# SQL Server Database Deployment Guide

## <%= classify(moduleName) %> Module - MSSQL Implementation

This guide provides instructions for deploying and configuring the SQL Server database components for the <%= classify(moduleName) %> module.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Stored Procedures Deployment](#stored-procedures-deployment)
6. [Testing Procedures](#testing-procedures)
7. [Connection Configuration](#connection-configuration)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Performance Optimization](#performance-optimization)

---

## Prerequisites

### Required Software

- **SQL Server** 2016 or higher (2019+ recommended)
  - Express, Standard, or Enterprise edition
  - SQL Server on Linux is supported
- **SQL Server Management Studio (SSMS)** 18.0 or higher (for Windows)
  - Or Azure Data Studio (cross-platform)
- **SQLCMD** command-line utility (included with SQL Server)

### Required Credentials

- Database server hostname/IP address
- SQL Server authentication credentials OR Windows Authentication
- Database name (will be created if doesn't exist)
- Appropriate permissions:
  - CREATE DATABASE (for initial setup)
  - CREATE TABLE (for schema creation)
  - CREATE PROCEDURE (for stored procedures)
  - SELECT, INSERT, UPDATE, DELETE (for data operations)

### Network Requirements

- Network connectivity to SQL Server (default port: 1433)
- Firewall rules allowing TCP connection to SQL Server port
- SQL Server Browser service running (for named instances)

---

## Architecture Overview

### Hexagonal Architecture - Database Adapter Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  (<%= classify(moduleName) %>RepositoryAdapter implements     │
│   I<%= classify(moduleName) %>Repository)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SqlServerService (Connection Pool)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           SQL Server Stored Procedures Layer                 │
│  • usp_<%= classify(moduleName) %>_SelectById                │
│  • usp_<%= classify(moduleName) %>_Insert                    │
│  • usp_<%= classify(moduleName) %>_Update                    │
│  • usp_<%= classify(moduleName) %>_Delete                    │
│  • etc.                                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQL Server Database                        │
│              Table: <%= classify(moduleName) %>              │
└─────────────────────────────────────────────────────────────┘
```

### Benefits of Stored Procedures

1. **Performance**: Pre-compiled and cached execution plans
2. **Security**: Parameterized queries prevent SQL injection
3. **Encapsulation**: Business logic centralized in database
4. **Maintainability**: DBAs can optimize without code changes
5. **Transaction Control**: Native BEGIN TRAN/COMMIT/ROLLBACK support

---

## Environment Configuration

### Environment Variables

Create or update your `.env` file with SQL Server connection settings:

```bash
# SQL Server Connection
MSSQL_HOST=localhost
MSSQL_PORT=1433
MSSQL_DATABASE=<%= classify(moduleName) %>DB
MSSQL_USER=sa
MSSQL_PASSWORD=YourSecurePassword123!

# Connection Pool Settings
MSSQL_POOL_MAX=10
MSSQL_POOL_MIN=2
MSSQL_POOL_IDLE_TIMEOUT=30000

# Connection Timeouts
MSSQL_CONNECTION_TIMEOUT=30000
MSSQL_REQUEST_TIMEOUT=30000

# Encryption (for Azure SQL or secure connections)
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false
```

### Connection String Format

The application uses `mssql` package connection configuration:

```typescript
{
  server: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE,
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: parseInt(process.env.MSSQL_POOL_MAX || '10'),
    min: parseInt(process.env.MSSQL_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.MSSQL_POOL_IDLE_TIMEOUT || '30000')
  }
}
```

---

## Database Setup

### Step 1: Create Database

**Option A: Using SSMS (GUI)**

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Right-click "Databases" → "New Database"
4. Enter database name: `<%= classify(moduleName) %>DB`
5. Configure file sizes and growth settings
6. Click "OK"

**Option B: Using T-SQL Script**

```sql
-- Create database
CREATE DATABASE [<%= classify(moduleName) %>DB];
GO

-- Use the database
USE [<%= classify(moduleName) %>DB];
GO

-- Verify database was created
SELECT name, database_id, create_date
FROM sys.databases
WHERE name = '<%= classify(moduleName) %>DB';
GO
```

**Option C: Using SQLCMD**

```bash
sqlcmd -S localhost -U sa -P YourPassword123! -Q "CREATE DATABASE [<%= classify(moduleName) %>DB]"
```

### Step 2: Create Table Schema

Execute the following script to create the `<%= classify(moduleName) %>` table:

```sql
USE [<%= classify(moduleName) %>DB];
GO

CREATE TABLE [dbo].[<%= classify(moduleName) %>] (
  -- Primary Key
  Id NVARCHAR(50) NOT NULL PRIMARY KEY,

  -- Business Fields
  Name NVARCHAR(255) NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

  -- Audit Fields
  CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
  UpdatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),

  -- Constraints
  CONSTRAINT CHK_<%= classify(moduleName) %>_Status
    CHECK (Status IN ('ACTIVE', 'INACTIVE', 'DELETED')),

  -- Indexes
  INDEX IX_<%= classify(moduleName) %>_Name NONCLUSTERED (Name),
  INDEX IX_<%= classify(moduleName) %>_Status NONCLUSTERED (Status),
  INDEX IX_<%= classify(moduleName) %>_CreatedAt NONCLUSTERED (CreatedAt DESC)
);
GO

-- Add table documentation
EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'<%= classify(moduleName) %> entity table for hexagonal architecture module',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'<%= classify(moduleName) %>';
GO

-- Add column documentation
EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'Unique identifier for <%= moduleName %>',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'<%= classify(moduleName) %>',
  @level2type = N'COLUMN', @level2name = N'Id';
GO

PRINT 'Table <%= classify(moduleName) %> created successfully!';
```

---

## Stored Procedures Deployment

### Step 1: Locate SQL Script

The stored procedures script is located at:
```
infra/db/mssql/stored-procs/<%= dasherize(moduleName) %>-procedures.sql
```

### Step 2: Review and Customize

Before deployment, review the script and customize:

1. **Database name**: Update `USE [YourDatabaseName]` line
2. **Table name**: Verify table name matches your schema
3. **Column types**: Adjust data types if needed
4. **Business logic**: Add any custom validation or business rules

### Step 3: Deploy Using SSMS

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Click "File" → "Open" → "File"
4. Select `<%= dasherize(moduleName) %>-procedures.sql`
5. Review the script
6. Click "Execute" (F5) or click the Execute button
7. Verify output: "Stored procedures for <%= classify(moduleName) %> module created successfully!"

### Step 4: Deploy Using SQLCMD

```bash
# Navigate to stored procedures directory
cd infra/db/mssql/stored-procs

# Execute script using SQLCMD
sqlcmd -S localhost -U sa -P YourPassword123! -d <%= classify(moduleName) %>DB -i <%= dasherize(moduleName) %>-procedures.sql

# Alternative: With Windows Authentication
sqlcmd -S localhost -E -d <%= classify(moduleName) %>DB -i <%= dasherize(moduleName) %>-procedures.sql
```

### Step 5: Verify Procedures Created

```sql
-- List all <%= classify(moduleName) %> stored procedures
SELECT
  name,
  create_date,
  modify_date
FROM
  sys.procedures
WHERE
  name LIKE 'usp_<%= classify(moduleName) %>%'
ORDER BY
  name;

-- Expected output:
-- usp_<%= classify(moduleName) %>_Count
-- usp_<%= classify(moduleName) %>_Delete
-- usp_<%= classify(moduleName) %>_Exists
-- usp_<%= classify(moduleName) %>_Insert
-- usp_<%= classify(moduleName) %>_SelectAll
-- usp_<%= classify(moduleName) %>_SelectById
-- usp_<%= classify(moduleName) %>_SelectByName
-- usp_<%= classify(moduleName) %>_SelectByStatus
-- usp_<%= classify(moduleName) %>_SelectPaginated
-- usp_<%= classify(moduleName) %>_Update
```

---

## Testing Procedures

### Manual Testing with SSMS

#### Test 1: Insert a <%= classify(moduleName) %>

```sql
USE [<%= classify(moduleName) %>DB];
GO

DECLARE @Result INT;

EXEC usp_<%= classify(moduleName) %>_Insert
  @Id = 'TEST-001',
  @Name = 'Test <%= classify(moduleName) %>',
  @Status = 'ACTIVE',
  @CreatedAt = '2025-01-01T10:00:00',
  @UpdatedAt = '2025-01-01T10:00:00',
  @Result = @Result OUTPUT;

PRINT 'Result: ' + CAST(@Result AS NVARCHAR(10));
-- Expected: Result: 1 (success)

SELECT * FROM [dbo].[<%= classify(moduleName) %>] WHERE Id = 'TEST-001';
```

#### Test 2: Select by ID

```sql
EXEC usp_<%= classify(moduleName) %>_SelectById @Id = 'TEST-001';
-- Expected: Returns one row with TEST-001 data
```

#### Test 3: Update

```sql
DECLARE @AffectedRows INT;

EXEC usp_<%= classify(moduleName) %>_Update
  @Id = 'TEST-001',
  @Name = 'Updated <%= classify(moduleName) %>',
  @Status = 'INACTIVE',
  @UpdatedAt = '2025-01-02T10:00:00',
  @AffectedRows = @AffectedRows OUTPUT;

PRINT 'Affected Rows: ' + CAST(@AffectedRows AS NVARCHAR(10));
-- Expected: Affected Rows: 1

SELECT * FROM [dbo].[<%= classify(moduleName) %>] WHERE Id = 'TEST-001';
```

#### Test 4: Select All

```sql
EXEC usp_<%= classify(moduleName) %>_SelectAll;
-- Expected: Returns all non-deleted records
```

#### Test 5: Pagination

```sql
DECLARE @TotalCount INT;

EXEC usp_<%= classify(moduleName) %>_SelectPaginated
  @Page = 1,
  @Limit = 10,
  @SortField = 'CreatedAt',
  @SortDirection = 'DESC',
  @TotalCount = @TotalCount OUTPUT;

PRINT 'Total Count: ' + CAST(@TotalCount AS NVARCHAR(10));
```

#### Test 6: Delete (Soft Delete)

```sql
DECLARE @AffectedRows INT;

EXEC usp_<%= classify(moduleName) %>_Delete
  @Id = 'TEST-001',
  @AffectedRows = @AffectedRows OUTPUT;

PRINT 'Affected Rows: ' + CAST(@AffectedRows AS NVARCHAR(10));
-- Expected: Affected Rows: 1

SELECT * FROM [dbo].[<%= classify(moduleName) %>] WHERE Id = 'TEST-001';
-- Expected: Status should be 'DELETED'
```

### Application-Level Testing

After deploying stored procedures, test the repository adapter:

```bash
# Run unit tests
npm run test adapters/outbound/db/mssql/<%= dasherize(moduleName) %>-repository.adapter.spec.ts

# Run integration tests
npm run test:e2e <%= dasherize(moduleName) %>.e2e-spec.ts
```

---

## Connection Configuration

### NestJS Module Configuration

Ensure SqlServerService is properly configured in your module:

```typescript
// <%= dasherize(moduleName) %>.module.ts
import { Module } from '@nestjs/common';
import { SqlServerService } from '@share/infrastructure/mssql/sqlserver.service';
import { <%= classify(moduleName) %>RepositoryAdapter } from './adapters/outbound/db/mssql/<%= dasherize(moduleName) %>-repository.adapter';
import { I<%= classify(moduleName) %>Repository } from './domain/ports/i-<%= dasherize(moduleName) %>-repository.port';

@Module({
  providers: [
    // Repository adapter implementation
    {
      provide: I<%= classify(moduleName) %>Repository,
      useClass: <%= classify(moduleName) %>RepositoryAdapter,
    },
    SqlServerService,
  ],
  exports: [I<%= classify(moduleName) %>Repository],
})
export class <%= classify(moduleName) %>Module {}
```

### Connection Pool Provider

The SQL_CONNECTION provider should be configured in your app module or infrastructure module:

```typescript
// app.module.ts or infrastructure.module.ts
import * as sql from 'mssql';

@Module({
  providers: [
    {
      provide: 'SQL_CONNECTION',
      useFactory: async () => {
        const config: sql.config = {
          server: process.env.MSSQL_HOST,
          port: parseInt(process.env.MSSQL_PORT || '1433'),
          database: process.env.MSSQL_DATABASE,
          user: process.env.MSSQL_USER,
          password: process.env.MSSQL_PASSWORD,
          options: {
            encrypt: process.env.MSSQL_ENCRYPT === 'true',
            trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
            enableArithAbort: true,
          },
          pool: {
            max: parseInt(process.env.MSSQL_POOL_MAX || '10'),
            min: parseInt(process.env.MSSQL_POOL_MIN || '2'),
            idleTimeoutMillis: parseInt(process.env.MSSQL_POOL_IDLE_TIMEOUT || '30000'),
          },
        };

        const pool = await sql.connect(config);
        return pool;
      },
    },
  ],
  exports: ['SQL_CONNECTION'],
})
export class InfrastructureModule {}
```

---

## Security Best Practices

### 1. Use Parameterized Queries

All stored procedures use parameterized inputs to prevent SQL injection:

```sql
-- ✅ GOOD: Parameterized
WHERE Id = @Id

-- ❌ BAD: String concatenation (vulnerable)
WHERE Id = ''' + @Id + '''
```

### 2. Principle of Least Privilege

Create a dedicated database user with minimal permissions:

```sql
-- Create application user
CREATE LOGIN <%= classify(moduleName) %>AppUser WITH PASSWORD = 'SecurePassword123!';
GO

USE [<%= classify(moduleName) %>DB];
GO

CREATE USER <%= classify(moduleName) %>AppUser FOR LOGIN <%= classify(moduleName) %>AppUser;
GO

-- Grant only necessary permissions
GRANT EXECUTE ON SCHEMA::dbo TO <%= classify(moduleName) %>AppUser;
GO

-- Do NOT grant:
-- - CREATE TABLE
-- - DROP TABLE
-- - ALTER TABLE
-- - CREATE PROCEDURE
```

### 3. Encrypt Connections

For production environments, always use encrypted connections:

```bash
# .env (Production)
MSSQL_ENCRYPT=true
MSSQL_TRUST_SERVER_CERTIFICATE=false
```

### 4. Secure Password Management

**Never commit passwords to version control!**

- Use environment variables
- Use Azure Key Vault or AWS Secrets Manager
- Use Kubernetes Secrets
- Rotate passwords regularly

### 5. Enable SQL Server Auditing

```sql
-- Enable server audit
CREATE SERVER AUDIT <%= classify(moduleName) %>_Audit
TO FILE (FILEPATH = 'C:\SQLAudit\')
WITH (ON_FAILURE = CONTINUE);
GO

ALTER SERVER AUDIT <%= classify(moduleName) %>_Audit WITH (STATE = ON);
GO

-- Create database audit specification
USE [<%= classify(moduleName) %>DB];
GO

CREATE DATABASE AUDIT SPECIFICATION <%= classify(moduleName) %>_DB_Audit
FOR SERVER AUDIT <%= classify(moduleName) %>_Audit
ADD (SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo BY public)
WITH (STATE = ON);
GO
```

### 6. Regular Backups

```sql
-- Full backup
BACKUP DATABASE [<%= classify(moduleName) %>DB]
TO DISK = 'C:\Backups\<%= classify(moduleName) %>DB_Full.bak'
WITH FORMAT, COMPRESSION;
GO

-- Differential backup
BACKUP DATABASE [<%= classify(moduleName) %>DB]
TO DISK = 'C:\Backups\<%= classify(moduleName) %>DB_Diff.bak'
WITH DIFFERENTIAL, COMPRESSION;
GO
```

---

## Troubleshooting

### Issue 1: Cannot Connect to SQL Server

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:1433
```

**Solutions:**

1. **Check SQL Server is running:**
   ```powershell
   # Windows
   Get-Service MSSQLSERVER

   # If stopped, start it
   Start-Service MSSQLSERVER
   ```

2. **Enable TCP/IP protocol:**
   - Open SQL Server Configuration Manager
   - Navigate to "SQL Server Network Configuration"
   - Right-click "TCP/IP" → "Enable"
   - Restart SQL Server service

3. **Check firewall rules:**
   ```powershell
   # Windows: Allow SQL Server port
   New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -LocalPort 1433 -Protocol TCP -Action Allow
   ```

4. **Verify connection string:**
   - Check MSSQL_HOST environment variable
   - Verify port (default: 1433)
   - For named instances, include instance name: `localhost\SQLEXPRESS`

### Issue 2: Login Failed for User

**Symptoms:**
```
Login failed for user 'sa'
```

**Solutions:**

1. **Enable SQL Server Authentication:**
   - SSMS → Right-click server → "Properties"
   - Security → Enable "SQL Server and Windows Authentication mode"
   - Restart SQL Server

2. **Reset SA password:**
   ```sql
   ALTER LOGIN sa ENABLE;
   GO
   ALTER LOGIN sa WITH PASSWORD = 'NewSecurePassword123!';
   GO
   ```

3. **Check user exists and has access:**
   ```sql
   SELECT name, is_disabled FROM sys.sql_logins WHERE name = 'YourUser';
   ```

### Issue 3: Stored Procedure Not Found

**Symptoms:**
```
Error: Could not find stored procedure 'usp_<%= classify(moduleName) %>_SelectById'
```

**Solutions:**

1. **Verify procedure exists:**
   ```sql
   SELECT name FROM sys.procedures WHERE name LIKE 'usp_<%= classify(moduleName) %>%';
   ```

2. **Check database context:**
   ```sql
   SELECT DB_NAME(); -- Verify you're in the correct database
   ```

3. **Re-deploy stored procedures:**
   ```bash
   sqlcmd -S localhost -U sa -P Password123! -d <%= classify(moduleName) %>DB -i <%= dasherize(moduleName) %>-procedures.sql
   ```

### Issue 4: Permission Denied

**Symptoms:**
```
The EXECUTE permission was denied on the object 'usp_<%= classify(moduleName) %>_Insert'
```

**Solutions:**

1. **Grant EXECUTE permission:**
   ```sql
   GRANT EXECUTE ON SCHEMA::dbo TO <%= classify(moduleName) %>AppUser;
   ```

2. **Verify user permissions:**
   ```sql
   EXECUTE AS USER = '<%= classify(moduleName) %>AppUser';
   SELECT * FROM fn_my_permissions(NULL, 'DATABASE');
   REVERT;
   ```

### Issue 5: Connection Pool Exhausted

**Symptoms:**
```
Error: ConnectionError: Connection pool exhausted
```

**Solutions:**

1. **Increase pool size:**
   ```bash
   # .env
   MSSQL_POOL_MAX=20  # Increase from 10
   ```

2. **Check for connection leaks:**
   - Ensure all queries properly close connections
   - Review long-running queries
   - Monitor active connections:
   ```sql
   SELECT
     DB_NAME(dbid) as DatabaseName,
     COUNT(dbid) as NumberOfConnections,
     loginame
   FROM sys.sysprocesses
   WHERE dbid > 0
   GROUP BY dbid, loginame
   ORDER BY NumberOfConnections DESC;
   ```

---

## Performance Optimization

### 1. Index Optimization

```sql
-- Analyze index usage
SELECT
  OBJECT_NAME(s.object_id) AS TableName,
  i.name AS IndexName,
  s.user_seeks,
  s.user_scans,
  s.user_lookups,
  s.user_updates
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) = '<%= classify(moduleName) %>'
ORDER BY s.user_seeks + s.user_scans + s.user_lookups DESC;

-- Identify missing indexes
SELECT
  migs.avg_user_impact,
  migs.avg_total_user_cost,
  mid.statement,
  mid.equality_columns,
  mid.inequality_columns,
  mid.included_columns
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE mid.database_id = DB_ID()
ORDER BY migs.avg_user_impact DESC;
```

### 2. Query Plan Caching

```sql
-- Enable query plan caching (default)
ALTER DATABASE [<%= classify(moduleName) %>DB] SET PARAMETERIZATION FORCED;
GO

-- View cached query plans
SELECT
  cp.usecounts,
  cp.objtype,
  cp.size_in_bytes,
  SUBSTRING(st.text, 1, 100) AS QueryText
FROM sys.dm_exec_cached_plans cp
CROSS APPLY sys.dm_exec_sql_text(cp.plan_handle) st
WHERE st.text LIKE '%<%= classify(moduleName) %>%'
ORDER BY cp.usecounts DESC;
```

### 3. Statistics Update

```sql
-- Update statistics for better query plans
UPDATE STATISTICS [dbo].[<%= classify(moduleName) %>] WITH FULLSCAN;
GO

-- Enable auto-update statistics
ALTER DATABASE [<%= classify(moduleName) %>DB] SET AUTO_UPDATE_STATISTICS ON;
GO
```

### 4. Monitoring Slow Queries

```sql
-- Find slow-running queries
SELECT TOP 10
  total_elapsed_time / 1000000.0 AS TotalSeconds,
  execution_count,
  (total_elapsed_time / execution_count) / 1000000.0 AS AvgSeconds,
  SUBSTRING(st.text, 1, 200) AS QueryText
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
WHERE st.text LIKE '%<%= classify(moduleName) %>%'
ORDER BY total_elapsed_time DESC;
```

---

## Additional Resources

### Official Documentation

- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)
- [mssql Package (Node.js)](https://www.npmjs.com/package/mssql)
- [SQL Server Best Practices](https://docs.microsoft.com/en-us/sql/relational-databases/sql-server-best-practices)

### Tools

- [SQL Server Management Studio (SSMS)](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- [Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/)
- [SQL Server Profiler](https://docs.microsoft.com/en-us/sql/tools/sql-server-profiler/)

### Community

- [Stack Overflow - SQL Server Tag](https://stackoverflow.com/questions/tagged/sql-server)
- [Database Administrators Stack Exchange](https://dba.stackexchange.com/)
- [SQL Server Central](https://www.sqlservercentral.com/)

---

## Support

For issues or questions:

1. Check this README troubleshooting section
2. Review application logs for error details
3. Check SQL Server error logs: `C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\Log\ERRORLOG`
4. Contact your database administrator
5. Open an issue in the project repository

---

**Last Updated:** <%= new Date().toISOString().split('T')[0] %>

**Version:** 1.0.0
