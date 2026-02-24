
-- brands table 
CREATE TABLE tblBrands(
	BrandName VARCHAR(250),
    CreatedDateTime DATETIME,
    PRIMARY KEY (BrandName)
    );

-- inventory table
CREATE TABLE tblInventory(
	InventoryID VARCHAR(50),
    Brand VARCHAR(250),
    Model VARCHAR(250),
    Description VARCHAR(2000),
    Owner VARCHAR(250),
    Active BOOLEAN,
    PRIMARY KEY(InventoryID)
	);

-- loan history table
CREATE TABLE tblLoans(
	LoanID VARCHAR(50),
    InventoryID VARCHAR(50),
    Borrower VARCHAR(250),
    DateOfLoan DATETIME,
    DateOfReturn DATETIME,
    PRIMARY KEY(LoanID)
);

-- users table
CREATE TABLE tblUsers(
	Email VARCHAR(250),
    FirstName VARCHAR(25),
    LastName VARCHAR(25),
    Password VARCHAR(500),
    CreatedDateTime DATETIME,
    LastUsedDateTime DATETIME,
    PRIMARY KEY (Email)
);

-- sessions table 
CREATE TABLE tblSessions(
	SessionID VARCHAR(50),
    UserID VARCHAR(250),
    CreatedDateTime DATETIME,
    PRIMARY KEY (SessionID)
);
