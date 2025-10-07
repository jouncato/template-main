/*
================================================================================
<%= classify(moduleName) %> Module - SQL Server Stored Procedures
================================================================================

Module: <%= classify(moduleName) %>
Description: Stored procedures for <%= moduleName %> data operations
Database: SQL Server 2016+ (supports DATETIME2, JSON functions)
Generated: <%= new Date().toISOString() %>

Architecture: Hexagonal Architecture (Ports & Adapters)
- These stored procedures serve as the database adapter layer
- Called by <%= classify(moduleName) %>RepositoryAdapter
- Implements I<%= classify(moduleName) %>Repository port interface

Deployment Instructions:
1. Review and customize table name (currently: <%= classify(moduleName) %>)
2. Ensure target database exists
3. Execute this script in SSMS or using SQLCMD:
   sqlcmd -S ServerName -d DatabaseName -i <%= dasherize(moduleName) %>-procedures.sql
4. Verify procedures created: SELECT * FROM sys.procedures WHERE name LIKE 'usp_<%= classify(moduleName) %>%'

Transaction Handling:
- Each procedure manages its own transaction scope
- Uses BEGIN TRANSACTION / COMMIT / ROLLBACK
- TRY/CATCH blocks for error handling
- RAISERROR for error propagation

Naming Convention:
- usp_<ModuleName>_<Operation>
- Example: usp_<%= classify(moduleName) %>_SelectById, usp_<%= classify(moduleName) %>_Insert

Output Parameters Convention:
- @Result INT OUTPUT: 1=success, 0=failure, -1=already exists, -2=not found
- @AffectedRows INT OUTPUT: Number of rows affected by operation
- @ErrorMessage NVARCHAR(500) OUTPUT: Error description (optional)

TODO Before Deployment:
[ ] Customize table name if different from <%= classify(moduleName) %>
[ ] Adjust column types to match your schema
[ ] Add any additional business logic or validation
[ ] Configure appropriate indexes for performance
[ ] Set up proper database permissions for application user
[ ] Test each procedure with sample data
[ ] Review and adjust transaction isolation levels if needed

================================================================================
*/

USE [YourDatabaseName] -- TODO: Replace with your database name
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_SelectById
================================================================================
Description: Retrieve a single <%= moduleName %> entity by its unique identifier
Parameters:
  @Id NVARCHAR(50) - Unique identifier of the <%= moduleName %>
Returns: Recordset with single row if found, empty recordset if not found
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_SelectById]
  @Id NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Select <%= moduleName %> by ID
    SELECT
      Id,
      Name,
      Status,
      CreatedAt,
      UpdatedAt
    FROM
      [dbo].[<%= classify(moduleName) %>] -- TODO: Adjust table name if needed
    WHERE
      Id = @Id;

  END TRY
  BEGIN CATCH
    -- Log error and re-throw
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_SelectAll
================================================================================
Description: Retrieve all <%= moduleName %> entities
Parameters: None
Returns: Recordset with all <%= moduleName %> records
Notes: Consider adding WHERE clause to filter deleted/inactive records
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_SelectAll]
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Select all <%= moduleName %> entities
    SELECT
      Id,
      Name,
      Status,
      CreatedAt,
      UpdatedAt
    FROM
      [dbo].[<%= classify(moduleName) %>]
    WHERE
      Status != 'DELETED' -- Exclude soft-deleted records
    ORDER BY
      CreatedAt DESC;

  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_SelectByStatus
================================================================================
Description: Retrieve <%= moduleName %> entities filtered by status
Parameters:
  @Status NVARCHAR(50) - Status to filter by (e.g., ACTIVE, INACTIVE)
Returns: Recordset with matching <%= moduleName %> records
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_SelectByStatus]
  @Status NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT
      Id,
      Name,
      Status,
      CreatedAt,
      UpdatedAt
    FROM
      [dbo].[<%= classify(moduleName) %>]
    WHERE
      Status = @Status
    ORDER BY
      CreatedAt DESC;

  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_SelectByName
================================================================================
Description: Retrieve a <%= moduleName %> entity by name (exact match)
Parameters:
  @Name NVARCHAR(255) - Name to search for
Returns: Recordset with single row if found, empty recordset if not found
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_SelectByName]
  @Name NVARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT
      Id,
      Name,
      Status,
      CreatedAt,
      UpdatedAt
    FROM
      [dbo].[<%= classify(moduleName) %>]
    WHERE
      Name = @Name;

  END TRY
  BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_Insert
================================================================================
Description: Insert a new <%= moduleName %> entity
Parameters:
  @Id NVARCHAR(50) - Unique identifier (generated by application)
  @Name NVARCHAR(255) - Name of the <%= moduleName %>
  @Status NVARCHAR(50) - Status (default: ACTIVE)
  @CreatedAt DATETIME2 - Creation timestamp
  @UpdatedAt DATETIME2 - Last update timestamp
  @Result INT OUTPUT - 1=success, -1=already exists, 0=failure
Returns: @Result output parameter
Transaction: Wrapped in BEGIN TRAN / COMMIT / ROLLBACK
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_Insert]
  @Id NVARCHAR(50),
  @Name NVARCHAR(255),
  @Status NVARCHAR(50),
  @CreatedAt DATETIME2,
  @UpdatedAt DATETIME2,
  @Result INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @Result = 0; -- Default to failure

  BEGIN TRY
    BEGIN TRANSACTION;

    -- Check if <%= moduleName %> with same ID already exists
    IF EXISTS (SELECT 1 FROM [dbo].[<%= classify(moduleName) %>] WHERE Id = @Id)
    BEGIN
      SET @Result = -1; -- Already exists
      ROLLBACK TRANSACTION;
      RETURN;
    END

    -- Insert new <%= moduleName %>
    INSERT INTO [dbo].[<%= classify(moduleName) %>] (
      Id,
      Name,
      Status,
      CreatedAt,
      UpdatedAt
    )
    VALUES (
      @Id,
      @Name,
      @Status,
      @CreatedAt,
      @UpdatedAt
    );

    -- Check if insert was successful
    IF @@ROWCOUNT > 0
    BEGIN
      SET @Result = 1; -- Success
      COMMIT TRANSACTION;
    END
    ELSE
    BEGIN
      SET @Result = 0; -- Failure
      ROLLBACK TRANSACTION;
    END

  END TRY
  BEGIN CATCH
    -- Rollback transaction on error
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;

    SET @Result = 0; -- Failure

    -- Log error and re-throw
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_Update
================================================================================
Description: Update an existing <%= moduleName %> entity
Parameters:
  @Id NVARCHAR(50) - Unique identifier of the <%= moduleName %> to update
  @Name NVARCHAR(255) - New name
  @Status NVARCHAR(50) - New status
  @UpdatedAt DATETIME2 - Update timestamp
  @AffectedRows INT OUTPUT - Number of rows affected (0 if not found)
Returns: @AffectedRows output parameter
Transaction: Wrapped in BEGIN TRAN / COMMIT / ROLLBACK
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_Update]
  @Id NVARCHAR(50),
  @Name NVARCHAR(255),
  @Status NVARCHAR(50),
  @UpdatedAt DATETIME2,
  @AffectedRows INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @AffectedRows = 0;

  BEGIN TRY
    BEGIN TRANSACTION;

    -- Update <%= moduleName %>
    UPDATE [dbo].[<%= classify(moduleName) %>]
    SET
      Name = @Name,
      Status = @Status,
      UpdatedAt = @UpdatedAt
    WHERE
      Id = @Id;

    -- Get number of affected rows
    SET @AffectedRows = @@ROWCOUNT;

    COMMIT TRANSACTION;

  END TRY
  BEGIN CATCH
    -- Rollback transaction on error
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;

    SET @AffectedRows = 0;

    -- Log error and re-throw
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_Delete
================================================================================
Description: Delete a <%= moduleName %> entity (soft delete by setting status)
Parameters:
  @Id NVARCHAR(50) - Unique identifier of the <%= moduleName %> to delete
  @AffectedRows INT OUTPUT - Number of rows affected (0 if not found)
Returns: @AffectedRows output parameter
Transaction: Wrapped in BEGIN TRAN / COMMIT / ROLLBACK
Notes: This is a soft delete. For hard delete, use DELETE statement instead of UPDATE.
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_Delete]
  @Id NVARCHAR(50),
  @AffectedRows INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @AffectedRows = 0;

  BEGIN TRY
    BEGIN TRANSACTION;

    -- Soft delete: Set status to DELETED
    UPDATE [dbo].[<%= classify(moduleName) %>]
    SET
      Status = 'DELETED',
      UpdatedAt = GETUTCDATE()
    WHERE
      Id = @Id;

    -- For hard delete, use this instead:
    -- DELETE FROM [dbo].[<%= classify(moduleName) %>]
    -- WHERE Id = @Id;

    -- Get number of affected rows
    SET @AffectedRows = @@ROWCOUNT;

    COMMIT TRANSACTION;

  END TRY
  BEGIN CATCH
    -- Rollback transaction on error
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;

    SET @AffectedRows = 0;

    -- Log error and re-throw
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_Exists
================================================================================
Description: Check if a <%= moduleName %> entity exists by ID
Parameters:
  @Id NVARCHAR(50) - Unique identifier to check
  @Exists BIT OUTPUT - 1 if exists, 0 if not
Returns: @Exists output parameter
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_Exists]
  @Id NVARCHAR(50),
  @Exists BIT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @Exists = 0;

  BEGIN TRY
    IF EXISTS (SELECT 1 FROM [dbo].[<%= classify(moduleName) %>] WHERE Id = @Id)
      SET @Exists = 1;
    ELSE
      SET @Exists = 0;

  END TRY
  BEGIN CATCH
    SET @Exists = 0;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_Count
================================================================================
Description: Count total number of <%= moduleName %> entities
Parameters:
  @TotalCount INT OUTPUT - Total count of entities
Returns: @TotalCount output parameter
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_Count]
  @TotalCount INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET @TotalCount = 0;

  BEGIN TRY
    SELECT @TotalCount = COUNT(*)
    FROM [dbo].[<%= classify(moduleName) %>]
    WHERE Status != 'DELETED'; -- Exclude soft-deleted records

  END TRY
  BEGIN CATCH
    SET @TotalCount = 0;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
PROCEDURE: usp_<%= classify(moduleName) %>_SelectPaginated
================================================================================
Description: Retrieve <%= moduleName %> entities with pagination
Parameters:
  @Page INT - Page number (1-based)
  @Limit INT - Number of items per page
  @SortField NVARCHAR(50) - Field to sort by (default: CreatedAt)
  @SortDirection NVARCHAR(4) - Sort direction: ASC or DESC (default: DESC)
  @TotalCount INT OUTPUT - Total count of all records (for pagination)
Returns:
  - Recordset with paginated results
  - @TotalCount output parameter
Notes: Uses OFFSET/FETCH for SQL Server 2012+ pagination
================================================================================
*/
CREATE OR ALTER PROCEDURE [dbo].[usp_<%= classify(moduleName) %>_SelectPaginated]
  @Page INT,
  @Limit INT,
  @SortField NVARCHAR(50) = 'CreatedAt',
  @SortDirection NVARCHAR(4) = 'DESC',
  @TotalCount INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Calculate offset
    DECLARE @Offset INT = (@Page - 1) * @Limit;

    -- Get total count
    SELECT @TotalCount = COUNT(*)
    FROM [dbo].[<%= classify(moduleName) %>]
    WHERE Status != 'DELETED';

    -- Get paginated results
    -- Dynamic ORDER BY based on @SortField and @SortDirection
    IF @SortField = 'Name'
    BEGIN
      IF @SortDirection = 'ASC'
        SELECT Id, Name, Status, CreatedAt, UpdatedAt
        FROM [dbo].[<%= classify(moduleName) %>]
        WHERE Status != 'DELETED'
        ORDER BY Name ASC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY;
      ELSE
        SELECT Id, Name, Status, CreatedAt, UpdatedAt
        FROM [dbo].[<%= classify(moduleName) %>]
        WHERE Status != 'DELETED'
        ORDER BY Name DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY;
    END
    ELSE -- Default: Sort by CreatedAt
    BEGIN
      IF @SortDirection = 'ASC'
        SELECT Id, Name, Status, CreatedAt, UpdatedAt
        FROM [dbo].[<%= classify(moduleName) %>]
        WHERE Status != 'DELETED'
        ORDER BY CreatedAt ASC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY;
      ELSE
        SELECT Id, Name, Status, CreatedAt, UpdatedAt
        FROM [dbo].[<%= classify(moduleName) %>]
        WHERE Status != 'DELETED'
        ORDER BY CreatedAt DESC
        OFFSET @Offset ROWS
        FETCH NEXT @Limit ROWS ONLY;
    END

  END TRY
  BEGIN CATCH
    SET @TotalCount = 0;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();

    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
  END CATCH
END
GO

/*
================================================================================
TABLE CREATION SCRIPT (OPTIONAL)
================================================================================
Uncomment and modify this script to create the <%= classify(moduleName) %> table
if it doesn't exist yet.
================================================================================

CREATE TABLE [dbo].[<%= classify(moduleName) %>] (
  Id NVARCHAR(50) NOT NULL PRIMARY KEY,
  Name NVARCHAR(255) NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
  UpdatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),

  -- Add constraints
  CONSTRAINT CHK_<%= classify(moduleName) %>_Status CHECK (Status IN ('ACTIVE', 'INACTIVE', 'DELETED')),

  -- Add indexes for performance
  INDEX IX_<%= classify(moduleName) %>_Name NONCLUSTERED (Name),
  INDEX IX_<%= classify(moduleName) %>_Status NONCLUSTERED (Status),
  INDEX IX_<%= classify(moduleName) %>_CreatedAt NONCLUSTERED (CreatedAt DESC)
);

-- Add extended properties for documentation
EXEC sp_addextendedproperty
  @name = N'MS_Description',
  @value = N'<%= classify(moduleName) %> entity table',
  @level0type = N'SCHEMA', @level0name = N'dbo',
  @level1type = N'TABLE', @level1name = N'<%= classify(moduleName) %>';

================================================================================
*/

PRINT 'Stored procedures for <%= classify(moduleName) %> module created successfully!';
PRINT 'Procedures created:';
PRINT '  - usp_<%= classify(moduleName) %>_SelectById';
PRINT '  - usp_<%= classify(moduleName) %>_SelectAll';
PRINT '  - usp_<%= classify(moduleName) %>_SelectByStatus';
PRINT '  - usp_<%= classify(moduleName) %>_SelectByName';
PRINT '  - usp_<%= classify(moduleName) %>_Insert';
PRINT '  - usp_<%= classify(moduleName) %>_Update';
PRINT '  - usp_<%= classify(moduleName) %>_Delete';
PRINT '  - usp_<%= classify(moduleName) %>_Exists';
PRINT '  - usp_<%= classify(moduleName) %>_Count';
PRINT '  - usp_<%= classify(moduleName) %>_SelectPaginated';
GO
