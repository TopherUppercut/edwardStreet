//  requestHandlers.js
//  Used to do all of the heavy lifting on our server
//  each function returns content for a different page

var mysql = require( "db-mysql" );

//  Helper object to store utility functions
var helper = {

  //  Helper function to return the proper date string to be inserted into the database
  date: function() {

    var cur = new Date();
    return cur.getFullYear() + "-" + cur.getMonth() + "-" + cur.getDate() + " " +
           cur.getHours() + ":" + cur.getMinutes() + ":00";
  },
  //  function to make database calls for us
  query: function( queryString, callback ) {

    new mysql.Database({
      hostname: "localhost",
      user: "dave",
      password: "asdfa",
      database: "edwardst_inv"
    }).on( "error", function( error ) {
      console.log( "ERROR: " + error );
    }).on( "ready", function( server ) {
     console.log( "Connected to " + server.hostname + " (" + server.version + ")" );
    }).connect( function( error ) {

      if ( error ) {
        console.log( "Error on connect: " + error );
      }

      this.query( queryString ).
      execute( function( error, rows, cols ) { callback( error, rows, cols ) });
    });
  }
}

// create an entry in respective history log tables
var historyLog = {
  user: function ( vals, category, comment ) {
  
    helper.query( "INSERT INTO USER_HISTORY( USER_ID, CATEGORY, COMMENT, AUTHOR, LOG_DATE ) " +
                  "VALUES( '" + vals.user_id + "', '" + category + "', '" + comment + 
                  "', '" + vals.curUserID + "', '" + helper.date() + "')",
                  function( error, rows, cols ) {

      if ( error ) {
        console.log( "Error on INSERT into USER_HISTORY: " + error );
      }
        
    });
  },
  
  supplier: function ( vals, category, comment ) {
  
    helper.query( "INSERT INTO SUPPLIER_HISTORY( SUPPLIER_ID, CATEGORY, COMMENT, AUTHOR, LOG_DATE ) " +
                  "VALUES( '" + vals.supplier_id + "', '" + category + "', '" + comment +
                  "', '" + vals.curUserID + "', '" + helper.date() + "')",
                  function( error, rows, cols ) {

      if ( error ) {
        console.log( "Error on INSERT into USER_HISTORY: " + error );
      }

    });
  },
  
  item: function ( vals, category, comment ) {
  
    helper.query( "INSERT INTO ITEM_HISTORY( ITEM_ID, CATEGORY, COMMENT, AUTHOR, LOG_DATE ) " +
                  "VALUES( '" + vals.item_id + "', '" + category + "', '" + comment + 
                  "', '" + vals.curUserID + "', '" + helper.date() + "')",
                  function( error, rows, cols ) {

      if ( error ) {
        console.log( "Error on INSERT into USER_HISTORY: " + error );
      }

    });
  },
  
  po: function ( vals, category, comment ) {
  
    helper.query( "INSERT INTO PO_HISTORY( PO_ID, CATEGORY, COMMENT, AUTHOR, LOG_DATE ) " +
                  "VALUES( '" + vals.po_id + "', '" + category + "', '" + comment + 
                  "', '" + vals.curUserID + "', '" + helper.date() + "')",
                  function( error, rows, cols ) {

      if ( error ) {
        console.log( "Error on INSERT into USER_HISTORY: " + error );
      }

    });
  }  
}

function index( response, cb ) {

  var vals = response.values;

  helper.query( "SELECT * FROM USER " +
				"WHERE USER_ID = '" + vals.user + "' AND PASSWORD = '" + vals.pass + "'",
				function( error, rows, cols ) {

    if ( error ) {
      console.log( "Error on select: " + error );
      return;
    }

    vals.curEmployeeID = rows[ 0 ] && rows[ 0 ].EMPLOYEE_ID;
    vals.curUserID = rows[ 0 ] && rows[ 0 ].USER_ID;
    vals.curRole = rows[ 0 ] && rows[ 0 ].ROLE;

    console.log( !!rows.length );
    cb && cb( !!rows.length );
  });
}

function login( response ) {

  response.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*"
  });
  response.write( response.values.hash );
  response.end();
}

function logout( response ) {
  response.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*"
  });
  response.write( "Logged Out" );
  response.end();
}

// Question: What is this?
function profile() {
  return "Profile";
}

// Question: What is this?
function logs() {
  return "Logs";
}

// Edit Account - allow current user to change his password/email.
function editAccount( response ) {

  var vals = response.values;
  vals.user_id = vals.curUserID;
  
  helper.query( "UPDATE USER SET PASSWORD = '" + vals.password + "', EMAIL = '" + vals.email + "' " +
                "WHERE USER_ID = '" + vals.use_id + "'", 
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( "Error on UPDATE USER: " + error );
      response.write( "Error occured while trying to change password/email." );
    } else {
      console.log( "Changed password/email." );
      response.write( "Password/email Successfully Changed" );
      historyLog.user( vals, "Change", "Changed password/email.");
    }

    response.end();
  });
}

// Create User - Step 1: Checks if current user_id already exists. Returns COUNT of 1 if it exists, Count of 0 if not.
function createUserCheckDupe( response ) {

  var vals = response.values;

  helper.query( "SELECT COUNT(*) FROM USER WHERE USER_ID = '" + vals.user_id + "'",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
        
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on select from USER: " + error );
      reponse.write( "Error occured while trying to create user." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }
    
    response.end();
  });
}

// Create User - Step 2: Insert new user into USER table. Inserts log into USER_HISTORY table.
function createUser( response ) {

  var vals = response.values;

  helper.query( "INSERT INTO USER( USER_ID, PASSWORD, EMAIL, EMPLOYEE_ID, ROLE, SUPPLIER_ID ) " +
                "VALUES('" + vals.user_id + "', '" + vals.password + "', '" + vals.email +
                "', '" + vals.employee_id + "', '" + vals.role + "', '" + vals.supplier_id + "')",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
                
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on INSERT into USER: " + error );
      response.write( "Error occured while trying to create user." );
    } else {
      console.log( "Created new user: " + vals.user_id );
      response.write( JSON.stringify( rows ) );
      response.write( "New user successfully created." );
      historyLog.user( vals, "Create", "Created new user." );
    }
    
    response.end();
  });  
}

// View User - Step 1: Returns number of users in USER table for page calculation.
function viewUsers( response ) {

  var vals = response.values;

  helper.query( "SELECT COUNT(*) FROM USER",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
                
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  
      console.log( "Error on SELECT from USER: " + error );
      response.write( "Error occured while trying to load the page." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }
    
    response.end();    
  });
}

// View User - Step 2: Returns a list of users for current page, ordered by USER_ID.
function viewUsersPage( response ) {

  var vals = response.values;

  helper.query( "SELECT u.USER_ID, u.EMAIL, u.EMPLOYEE_ID, u.ROLE, s.NAME " + 
                "FROM USER u LEFT JOIN SUPPLIER s ON u.SUPPLIER_ID = s.SUPPLIER_ID " + 
                "ORDER BY USER_ID " +
                "LIMIT " + (vals.pagenum-1)*20 + ", 20",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
                
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from USER, SUPPLIER: " + error );
      response.write( "Error occured while trying to load the page." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }  

    response.end();
  });
}

// Edit User - Update USER table with new user information for row USER_ID.
// Question: console.log may print password?
function editUser( response ) {

  var vals = response.values;

  helper.query( "UPDATE USER SET USER_ID = '" + vals.user_id + "', EMAIL = '" + vals.email +
                "', EMPLOYEE_ID = '" + vals.employee_id + "', ROLE = '" + vals.role + "' " +
                "WHERE USER_ID = '" + vals.old_user_id + "'",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
    
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on UPDATE USER: " + error );
      response.write( "Error occured while trying to change user information." );
    } else {
      console.log( "Changed user information: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "User information succussfully changed." );
      historyLog.user( vals, "Change", "Changed user information." );      
    }
    
    response.end();
  });
}

// Delete User - Delete selected user from USER table.
function deleteUser( response ) {

  var vals = response.values;
  
  helper.query( "DELETE FROM USER WHERE USER_ID = '" + vals.user_id + "'",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
    
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on DELETE from USER: " + error );
      response.write( "Error occured while trying to delete user." );
    } else {
      console.log( "Deleted user: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "User successfully deleted." ); 
      historyLog.user( vals, "Delete", "Deleted user." );
    }

    response.end();
  });
}

// Create Item - Step 1: Checks if current itemname+supplier already exists. Returns COUNT of 1 if it exists, Count of 0 if not.
function createItemCheckDupe( response ) {

  var vals = response.values;

  helper.query( "SELECT COUNT(*) FROM ITEM " +
                "WHERE LOWER(ITEM_NAME) = LOWER('" + vals.item_name + "') AND SUPPLIER_ID = " + vals.supplier_id,
                function( error, rows, cols ) {
  
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT ITEM: " + error );
      response.write( "Error occured while trying to create item." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }

    response.end();
  });
}

// Create Item - Step 2: Insert new item into ITEM table. Inserts log into ITEM_HISTORY table.
function createItem( response ) {

  var vals = response.values;

  helper.query( "INSERT INTO ITEM( DIST_CODE, ITEM_NAME, RECEIPT_NAME, CATEGORY, UNIT, ITEM_TYPE, COMMENT, SUPPLIER_ID, " +
                "U_MINOR_REPO, U_ACTIVE_INA, U_BIZERBA, U_BRAND, U_CASE_SIZE, U_COOKING_IN, U_COUNTRY, U_DESCRIPTO, " +
                "U_EXPIRY_DAT, U_INGREDIENT, U_KEYWORDS, U_NOTES, U_ORDER, U_PLU, U_PRICE, U_SILVERWARE, U_SKU, U_STORAGE, " +
                "U_STORAGE_TY, U_TYPE, U_UPC_CODE, U_PRICE_PER, U_TAX, U_SCALE) " +
                "VALUES('" + vals.dist_code + "', '" + vals.item_name + "', '" + vals.receipt_name +
                "', '" + vals.category + "', '" + vals.unit + "', '" + vals.item_type + "', '" + vals.comment +
                "', '" + vals.supplier_id + "', '" + vals.u_minor_repo + "', '" + vals.u_active_ina +
                "', '" + vals.u_bizerba + "', '" + vals.u_brand + "', '" + vals.u_case_size +
                "', '" + vals.u_cooking_in + "', '" + vals.u_country + "', '" + vals.u_descripto +
                "', '" + vals.u_expiry_dat + "', '" + vals.u_ingredient + "', '" + vals.u_keywords +
                "', '" + vals.u_notes + "', '" + vals.u_order + "', '" + vals.u_plu + "', '" + vals.u_price +
                "', '" + vals.u_silverware + "', '" + vals.u_sku + "', '" + vals.u_storage +
                "', '" + vals.u_storage_ty + "', '" + vals.u_type + "', '" + vals.u_upc_code +
                "', '" + vals.u_price_per + "', '" + vals.u_tax + "', '" + vals.u_scale + "' )",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
                
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( "Error on INSERT into ITEM: " + error );
      response.write( "Error occured while trying to create item." );
    } else {
      console.log("Created new item: " + vals.item_name );
      response.write( JSON.stringify( rows ) );
      response.write( "New item successfully created." );
    
	    // Get item_id of the item just created.
      helper.query( "SELECT LAST_INSERT_ID()", function( error, rows, cols ) {
        if ( error ) {
          console.log( "Error in SELECT LAST_INSERT_ID(): " + error );
        } else {
          vals.item_id = rows[ 0 ]["LAST_INSERT_ID()"];
          historyLog.item( vals, "Create", "Created new item." );
        }
      });
    }
    
    response.end();
  });  
}

// View Items - Step 1: Returns number of items in ITEM table for page calculation.
function viewItems( response ) {

  var vals = response.values;

  helper.query( "SELECT COUNT(*) FROM ITEM",
                function ( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from ITEM: " + error );
      response.write( "Error occured while trying to load page." );
    } else {
      response.write( JSON.stringify( rows ) );
    }
    
    response.end();
  });
}

// View Items - Step 2: Returns a list of users for current page, ordered by Item_Name.
function viewItemsPage( response) {

  var vals = response.values;

  helper.query( "SELECT i.ITEM_ID, i.DIST_CODE, i.ITEM_NAME, i.RECEIPT_NAME, i.CATEGORY, i.UNIT, i.ITEM_TYPE, " +
                "i.COMMENT, p.PRICE, s.NAME " +
                "FROM ITEM i LEFT OUTER JOIN SUPPLIER s ON i.SUPPLIER_ID = s.SUPPLIER_ID " +
                "LEFT OUTER JOIN PRICE_HISTORY p ON i.LATEST_PRICE = PRICE_ID " +
                "ORDER BY i.ITEM_NAME LIMIT " + (vals.pagenum-1)*20 + ", 20",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from ITEM, SUPPLIER, PRICE_HISTORY: " + error );
      response.write( "Error occured while trying to load page." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// Edit Item - Update ITEM table with new item information for row ITEM_ID.
function editItem( response ) {

  var vals = response.values;

  helper.query( "UPDATE ITEM SET DIST_CODE = '" + vals.dist_code + "', ITEM_NAME = '" + vals.item_name +
                "', RECEIPT_NAME = '" + vals.receipt_name + "', CATEGORY = '" + vals.category +"', UNIT = '" + vals.unit +
                "', ITEM_TYPE = '" + vals.item_type + "', COMMENT = '" + vals.comment + ", SUPPLIER_ID = '" + vals.supplier_id +
                "', U_MINOR_REPO = '" + vals.u_minor_repo + "', U_ACTIVE_INA = '" + vals.u_active_ina +
                "', U_BIZERBA = '" + vals.u_bizerba + "', U_BRAND = '" + vals.u_brand + "', U_CASE_SIZE = '" + vals.u_case_size +
                "', U_COOKING_IN = '" + vals.u_cooking_in + "', U_COUNTRY = '" + vals.u_country +
                "', U_DESCRIPTO = '" + vals.u_descripto + "', U_EXPIRY_DAT = '" + vals.u_expiry_dat +
                "', U_INGREDIENT = '" + vals.u_ingredient + "', U_KEYWORDS = '" + vals.u_keywords +
                "', U_NOTES = '" + vals.u_notes + "', U_ORDER = '" + vals.u_order + "', U_PLU = '" + vals.u_plu +
                "', U_PRICE = '" + vals.u_price + "', U_SILVERWARE = '" + vals.u_silverware + "', U_SKU = '" + vals.u_sku +
                "', U_STORAGE = '" + vals.u_storage + "', U_STORAGE_TY = '" + vals.u_storage_ty +
                "', U_TYPE = '" + vals.u_type + "', U_UPC_CODE = '" + vals.u_upc_code + "', U_PRICE_PER = '" + vals.u_price_per +
                "', U_TAX = '" + vals.u_tax + "', U_SCALE = '" + vals.u_scale + "' " +
                "WHERE ITEM_ID = " + vals.item_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });    

    if ( error ) {
      console.log( "Error on UPDATE ITEM: " + error );
      response.write( "Error occured while trying to change item information." );
    } else {
      console.log( "Changed item information: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Item information succussfully changed." );
      historyLog.item( vals, "Change", "Changed item information.");
    }

    response.end();
  });
}

// Delete Item - Delete selected item from ITEM table.
function deleteItem( response ) {

  var vals = response.values;
  
  helper.query( "DELETE FROM ITEM WHERE ITEM_ID = '" + vals.item_id + "'",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
    
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on DELETE from ITEM: " + error );
      response.write( "Error occured while trying to delete item." );
    } else {
      console.log( "Deleted item: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Item successfully deleted." ); 
      historyLog.item( vals, "Delete", "Deleted item." );
    }

    response.end();
  });
}
  
// Create Price - creates a new entry in price_history and update the item with the new price_id.
function createPrice ( response ) {

  var vals = response.values;
  
  // create a new price entry
  helper.query( "INSERT INTO PRICE_HISTORY( ITME_ID, PRICE, AUTHOR, LOG_DATE) " +
                "VALUES ( " + vals.item_id + ", " + vals.price + ", '" + vals.curUserID + "', '" + helper.date() + "' )" +
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
  
    if ( error ) {
      console.log( "Error on INSERT into PRICE_HISTORY: " + error );
      response.write( "Error occured while trying to change price." );
    } else {
      console.log( "Created new price." );
    // get price_id of the price just created.
      helper.query( "SELECT LAST_INSERT_ID()", function( error, rows, cols ) {
        if ( error ) {
          console.log( "Error in SELECT LAST_INSERT_ID(): " + error );
        } else {
          vals.price_id = rows[ 0 ]["LAST_INSERT_ID()"];
          
          // update item with new price_id
          helper.query( "UPDATE ITEM SET LATEST_PRICE = " + vals.price_id + "WHERE ITEM_ID = " + vals.item_id,
                        function( error, rows, cols ) {
            if ( error ) {
              console.log( "Error on UPDATE ITEM with new price: " + error );
            } else {
              console.log( "Price changed on item: " + vals.item_id );
              historyLog( vals, "Change", "Changed price." );
            }
          });
        }
      });
    }

    response.end();
  });
}

// View Price - Display list of 20 latest prices for the current item_id
function viewPrice ( response ) {

  var vals = response.values;
  
  helper.query( "SELECT PRICE, LOG_DATE FROM PRICE_HISTORY WHERE ITEM_ID = " + vals.item_id +
                "ORDERED BY LOG_DATE DESC LIMIT 20",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from PRICE_HISTORY: " + error );
      response.write( "Error occured while trying to load page." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// Create Supplier - Step 1: Checks if current supplier_name already exists. Returns COUNT of 1 if it exists, Count of 0 if not.
function createSupplierCheckDupe( response ) {

  var vals = response.values;

  helper.query( "SELECT COUNT(*) FROM USER WHERE LOWER(NAME) = LOWER('" + vals.user_id + "')",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
        
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on select from SUPPLIER: " + error );
      reponse.write( "Error occured while trying to create supplier." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }

    response.end();
  });
}

// Create Supplier - Step 2: Insert new supplier into SUPPLIER table. Inserts log into SUPPLIER_HISTORY table.
function createSupplier( response ) {

  var vals = response.values;

  helper.query( "INSERT INTO SUPPLIER( NAME, LEGAL_NAME, LEAD_TIME, SUPPLIER_COMMENT, SPECIAL_COMMENT ) " +
                "VALUES('" + vals.name + "', '" + vals.legal_name + "', '" + vals.lead_time +
                "', '" + vals.supplier_comment + "', '" + vals.special_comment + "')",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")" );
                
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on INSERT into SUPPLIER: " + error );
      response.write( "Error occured while trying to create supplier." );
    } else {
      console.log( "Created new supplier: " + vals.user_id );
      response.write( JSON.stringify( rows ) );
      response.write( "New supplier successfully created." );

      helper.query( "SELECT LAST_INSERT_ID()", function( error, rows, cols ) {

        if ( error ) {
          console.log( "Error in SELECT LAST_INSERT_ID(): " + error );
        } else {
          vals.supplier_id = rows[ 0 ]["LAST_INSERT_ID()"];
          historyLog.supplier( vals, "Create", "Created new supplier." );
        }
      });
    }

    response.end();
  });
}

// View Supplier - Step 1: Return number of suppliers in SUPPLIER table for page calculation.
function viewSuppliers( response ) {
  
  helper.query( "SELECT COUNT(*) FROM SUPPLIER",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
                
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from SUPPLIER: " + error );
      response.write( "Error occured while trying to load page." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// View Supplier - Step 2: Returns a list of suppliers for current page, ordered by name
function viewSuppliersPage( response ) {
  
  helper.query( "SELECT * FROM SUPPLIER ORDER BY NAME LIMIT " + (response.pagenum-1)*20 + ", 20", 
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
                
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from SUPPLIER: " + error );
      response.write( "Error occured while trying to load page." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// Edit Supplier - Update SUPPLIER table with new item information for row SUPPLIER_ID.
function editSupplier( response ) {

  var vals = response.values;

  helper.query( "UPDATE SUPPLIER SET NAME = '" + vals.name + "', LEGAL_NAME = '" + vals.legal_name +
                "', LEAD_TIME = '" + vals.lead_time + "', SUPPLIER_COMMENT = '" + vals.supplier_comment +
                "', SPECIAL_COMMENT = '" + vals.special_comment + "'" +
                "WHERE SUPPLIER_ID = " + vals.supplier_id,
                function( error, rows, cols ) {
  
    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });    

    if ( error ) {
      console.log( "Error on UPDATE SUPPLIER: " + error );
      response.write( "Error occured while trying to change supplier information." );
    } else {
      console.log( "Changed supplier information: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Supplier information succussfully changed." );
      historyLog.supplier( vals, "Change", "Changed supplier information." );
    }

    response.end();
  });
}

// Delete Supplier - Delete selected supplier from SUPPLIER Table.
function deleteSupplier( response ) {

  var vals = response.values;
  
  helper.query( "DELETE FROM SUPPLIER WHERE SUPPLIER_ID = '" + vals.supplier_id + "'",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
    
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on DELETE from SUPPLIER: " + error );
      response.write( "Error occured while trying to delete supplier." );
    } else {
      console.log( "Deleted supplier: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Supplier successfully deleted." ); 
      historyLog.supplier( vals, "Delete", "Deleted supplier." );
    }

    response.end();
  });
}

// Create Contact Person - create a new contact person
function createContactPerson ( response ) {

  var vals = response.values;

  helper.query( "INSERT INTO CONTACT_PERSON ( SUPPLIER_ID, LAST_NAME, FIRST_NAME, PHONE_NUMBER, EMAIL ) " +
                "VALUES( " + vals.supplier_id + ", '" + vals.last_name + "', '" + vals.first_name +
                "', '" + vals.phone_number + "', '" + vals.email + "' )",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
                
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( "Error on INSERT into CONTACT_PERSON: " + error );
      response.write( "Error occured while trying to create contact person." );
    } else {
      console.log("Created new contact person: " + rows );
      response.write( JSON.stringify( rows ) );
      response.write( "New contact person successfully created." );
      historyLog.supplier( vals, "Change", "Created new contact person." );
    }
    
    response.end();
  });  
}

// View Contact Person - return info of contact person(s) for supplier_id
function viewContactPerson ( response ) {

  var vals = response.values;

  helper.query( "SELECT LAST_NAME, FIRST_NAME, PHONE_NUMBER, EMAIL FROM CONTACT_PERSON " +
                "WHERE SUPPLIER_ID = " + vals.supplier_id + " ORDER BY LAST_NAME",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from CONTACT_PERSON: " + error );
      response.write( "Error occured while trying to load contact person(s)." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// Edit Contact Person - change a contact person's information.
function editContactPerson ( response ) {

  var vals = response.values;

  helper.query( "UPDATE CONTACT_PERSON SET LAST_NAME = '" + vals.last_name + "', FIRST_NAME ='" + vals.first_name +
                "', PHONE_NUMBER = '" + vals.phone_number + "', EMAIL = '" + vals.email + "' " +
                "WHERE CONTACT_PERSON_ID = " + vals.contact_person_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });    

    if ( error ) {
      console.log( "Error on UPDATE CONTACT_PERSON: " + error );
      response.write( "Error occured while trying to change contact person information." );
    } else {
      console.log( "Changed contact person information: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Contact person information succussfully changed." );
      historyLog.supplier( vals, "Change", "Changed contact person information.");
    }

    response.end();
  });
}

// Delete Contact Person - delete a person from contact_person
function deleteContactPerson ( response ) {

  var vals = response.values;
  
  helper.query( "DELETE FROM CONTACT_PERSON WHERE CONTACT_PERSON_ID = " + vals.contact_person_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
    
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });                

    if ( error ) {
      console.log( "Error on DELETE from CONTACT_PERSON: " + error );
      response.write( "Error occured while trying to delete contact person." );
    } else {
      console.log( "Deleted contact person: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Contact person successfully deleted." ); 
      historyLog.supplier( vals, "Change", "Deleted contact person." );
    }

    response.end();
  });
}

// Create Supplier Address - Create a new supplier address in SUPPLIER_ADDRESS table.
function createSupplierAddress ( response ) {
  var vals = response.values;

  helper.query( "INSERT INTO SUPPLIER_ADDRESS ( SUPPLIER_ID, ADDRESS_LINE_1, ADDRESS_LINE_2, CITY, PROV_STATE, COUNTRY, POSTAL_ZIP, PHONE_NUMBER ) " +
                "VALUES( " + vals.supplier_id + ", '" + vals.address_line_1 + "', '" + vals.address_line_2 +
                "', '" + vals.city + "', '" + vals.prov_state + "', '" + vals.country + "', '" + vals.postal_zip +
                "', '" + vals.phone_number + "' )",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
                
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( "Error on INSERT into SUPPLIER_ADDRESS: " + error );
      response.write( "Error occured while trying to create supplier address." );
    } else {
      console.log("Created new supplier address: " + rows );
      response.write( JSON.stringify( rows ) );
      response.write( "New supplier address successfully created." );
      historyLog.supplier( vals, "Change", "Created new supplier address." );
    }
    
    response.end();
  });  
}

// View Supplier Address - return a list of supplier addresses.
function viewSupplierAddress ( response ) {

  var vals = response.values;

  helper.query( "SELECT ADDRESS_LINE_1, ADDRESS_LINE_2, CITY, PROV_STATE, COUNTRY, POSTAL_ZIP, PHONE_NUMBER " +
                "FROM SUPPLIER_ADDRESS WHERE SUPPLIER_ID = " + vals.supplier_id + " ORDER BY ADDRESS_ID",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from SUPPLIER_ADDRESS: " + error );
      response.write( "Error occured while trying to load supplier address(es)." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// Edit Supplier Address - Change a supplier address' information.
function editSupplierAddress ( response ) {

  var vals = response.values;

  helper.query( "UPDATE SUPPLIER_ADDRESS SET ADDRESS_LINE_1 = '" + vals.address_line_1 + "', ADDRESS_LINE_2 ='" + vals.address_line_2 +
                "', CITY = '" + vals.city + "', PROV_STATE = '" + vals.prov_state + "', COUNTRY = '" + vals.country +
                "', POSTAL_ZIP = '" + vals.postal_zip + "', PHONE_NUMBER = '" + vals.phone_number + "' " + 
                "WHERE ADDRESS_ID = " + vals.address_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });    

    if ( error ) {
      console.log( "Error on UPDATE SUPPLIER_ADDRESS: " + error );
      response.write( "Error occured while trying to change supplier address information." );
    } else {
      console.log( "Changed supplier address information: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Supplier address information succussfully changed." );
      historyLog.supplier( vals, "Change", "Changed supplier address information.");
    }

    response.end();
  });
}

// Delete Supplier Address - Delete a supplier address entry in the SUPPLIER_ADDRESS table.
function deleteSupplierAddress ( response ) {

  var vals = response.values;
  
  helper.query( "DELETE FROM SUPPLIER_ADDRESS WHERE ADDRESS_ID = " + vals.address_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
    
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });                

    if ( error ) {
      console.log( "Error on DELETE from SUPPLIER_ADDRESS: " + error );
      response.write( "Error occured while trying to delete supplier address." );
    } else {
      console.log( "Deleted supplier address: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Supplier address successfully deleted." ); 
      historyLog.supplier( vals, "Change", "Deleted supplier address." );
    }

    response.end();
  });
}

// Create PO - Creates a new purchase order in queue status in PURCHASE_ORDER table.
function createPurchaseOrder( response ) {

  var vals = response.values;
  
  helper.query( "INSERT INTO PURCHASE_ORDER( STATUS, CREATE_DATE, DELIVERY_DATE, DELIVER_TIME, REF_NUMBER, COMMENT, SUPPLIER_ID )" +
                "VALUES( 'Queued', '" + helper.date() + "', '" + vals.delivery_date + "', '" + vals.delivery_time +
                "', '" + vals.ref_number + "', '" + vals.comment + "', " + vals.supplier_id + " )",
                function( error, rows, cols ) {
                
    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
                
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on INSERT into PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to create purchase order." );
    } else {
      console.log("Created new purchase order: " + rows );
      response.write( JSON.stringify( rows ) );
      response.write( "New purchase successfully created." );
      historyLog.po( vals, "Create", "Created new purchase order." );
    }
    
    response.end();
  });
}

// View PO - Step 1: Returns number of POs in Purchase_order table for page calculation.
function viewPurchaseOrders( response ) {

  var vals = response.values;

  helper.query( "SELECT COUNT(*) FROM PURCHASE_ORDER WHERE STATUS = '" + vals.status + "'",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });  
                
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  
      console.log( "Error on SELECT from PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to load the page." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }

    response.end();
  });
}

// View PO - Step 2: Returns a list of POs for current page, ordered by PO_ID.
function viewPurchaseOrdersPage ( response ) {

  var vals = response.values;

  helper.query( "SELECT po.PO_ID, po.STATUS, po.CREATE_DATE, po.SUBMIT_DATE, po.DELIVERY_DATE, po.DELIVERY_TIME, " +
                "po.RECEIVE_DATE, po.REF_NUMBER, po.COMMENT, s.NAME FROM PURCHASE_ORDER po " + 
                "LFET OUTER JOIN SUPPLIER s ON po.SUPPLIER_ID = s.SUPPLIER_ID " +
                "ORDER BY po.PO_ID LIMIT " + (response.values.pagenum-1)*20 + ", 20",
                function( error, rows, cols ) {
       
    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
                
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from PURCHASE_ORDER, SUPPLIER: " + error );
      response.write( "Error occured while trying to load the page." );
    } else {
      response.write( JSON.stringify( rows ) ); 
    }  

    response.end();
  });
}

// Edit PO - Change information in purchase order.
function editPurchaseOrder( response ) {

  var vals = response.values;

  helper.query( "UPDATE PURCHASE_ORDER SET DELIVERY_DATE = '" + vals.delivery_date + "', DELIVERY_TIME = '" + vals.delivery_time +
                "', REF_NUMBER = '" + vals.ref_number + "', COMMENT = '" + vals.comment + "', SUPPLIER_ID = " + vals.supplier_id +
                " WHERE PO_ID = " + vals.po_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on UPDATE PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to change purchase order information." );
    } else {
      console.log( "changed purchase order information.", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Changed purchase order." );
      historyLog.po( vals, "Change", "Changed purchase order information.");
    }

    response.end();
  });
}

// Submit PO - submit a purchase order.
function submitPurchaseOrder( response ) {

  var vals = response.values;

  helper.query( "UPDATE PURCHASE_ORDER SET STATUS = 'Submitted', SUBMIT_DATE = '" + helper.date() + "' " +
                "WHERE PO_ID = " + vals.po_id + "",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on UPDATE PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to submit purchase order." );
    } else {
      console.log( "Submitted purchase order.", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Submitted purchase order." );
      historyLog.po( vals, "Submit", "Submitted purchase order.");
    }

    response.end();
  });
}

// Cancel PO - cancel a purchase order.
function cancelPurchaseOrder( response ) {

  var vals = response.values;

  helper.query( "UPDATE PURCHASE_ORDER SET STATUS = 'Cancelled' WHERE PO_ID = " + vals.po_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on UPDATE PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to cancel purchase order." );
    } else {
      console.log( "Cancelled purchase order.", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Cancelled purchase order." );
      historyLog.po( vals, "Cancel", "Cancelled purchase order.");
    }

    response.end();
  });
}

// Return PO - return a purchase order.
function returnPurchaseOrder( response ) {

  var vals = response.values;

  helper.query( "UPDATE PURCHASE_ORDER SET STATUS = 'Returned' " +
                "WHERE PO_ID = " + vals.po_id,
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on UPDATE PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to return purchase order." );
    } else {
      console.log( "Returned purchase order.", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Returned purchase order." );
      historyLog.po( vals, "Return", "Returned purchase order.");
    }

    response.end();
  });
}

// Receive PO - receive a purchase order.
function receivePurchaseOrder( response ) {

  var vals = response.values;

  helper.query( "UPDATE PURCHASE_ORDER SET STATUS = 'Received', RECEIVE_DATE = '" + helper.date() + "' " +
                "WHERE PO_ID = " + vals.po_id + "",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( "Error on UPDATE PURCHASE_ORDER: " + error );
      response.write( "Error occured while trying to receive purchase order." );
    } else {
      console.log( "Received purchase order.", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "Received purchase order." );
      historyLog.po( vals, "Receive", "Received purchase order.");
    }

    response.end();
  });
}

// Create PO Line - Create a new pO line.
function createOrderLine( response ) {

  var vals = response.values;
  
  helper.query( "INSERT INTO PO_LINE( PO_ID, PO_LINE_ID, ITEM_ID, QTY_ORDERED, COMMENT, AUTHOR, PRICE_ID) " +
                "VALUES( '" + vals.po_id + "', " + vals.po_line + "', '" + vals.item_id + "', '" + vals.qty_ordered +
                "', '" + vals.comment + "', '" + vals.curUserID + "', '" + vals.price_id + "' ) " +
                function( error, rows, cols ) {
    
    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( "Error on INSERT into PO_LINE: " + error );
      response.write( "Error occured while trying to create PO line." );
    } else {
      console.log("Created new PO line: " + rows );
      response.write( JSON.stringify( rows ) );
      response.write( "New PO line successfully created." );
      historyLog.po( vals, "Change", "Created new PO line." );
    }
    
    response.end();
  });
}

// View PO Line - view all PO Lines of a particular PO.
function viewOrderLine( response ) {

  var vals = response.values;

  helper.query( "SELECT p.PO_LINE_ID, i.ITEM_NAME, p.QTY_ORDERED, p.QTY_RECEIVED, p.COMMENT, p.AUTHOR, ph.PRICE " +
                "FROM PO_LINE p LEFT OUTER JOIN ITEM i ON p.ITEM_ID = i.ITEM_ID " +
                "LEFT OUTER JOIN PRICE_HISTORY ph ON p.PRICE_ID = ph.PRICE_ID WHERE PO_ID = '" + vals.po_id + "' " + 
                "ORDER BY PO_LINE_ID",
                function( error, rows, cols ) {

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    
    if ( error ) {
      console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");
      console.log( "Error on SELECT from PO_LINE: " + error );
      response.write( "Error occured while trying to load PO lines." );
    } else {
      response.write( JSON.stringify( rows ) );
    }

    response.end();
  });
}

// Edit PO Line - change PO line information.
function editOrderLine( response ) {
  var vals = response.values;

  helper.query( "UPDATE PO_LINE SET ITEM_ID = '" + vals.item_id + "', QTY_ORDERED ='" + vals.qty_ordered +
                "', QTY_RECEIVED = '" + vals.qty_received + "', COMMENT = '" + vals.comment + "', AUTHOR = '" + vals.curUserID +
                "', PRICE_ID = '" + vals.price_id + "' " + 
                "WHERE PO_ID = '" + vals.po_id + "' AND PO_LINE_ID = '" + vals.po_line_id + "'",
                function( error, rows, cols ) {

    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");  

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });    

    if ( error ) {
      console.log( "Error on UPDATE PO_LINE: " + error );
      response.write( "Error occured while trying to change PO line information." );
    } else {
      console.log( "Changed PO line information: ", rows );
      response.write( JSON.stringify( rows ) );
      response.write( "PO line information succussfully changed." );
      historyLog.supplier( vals, "Change", "Changed PO line information.");
    }

    response.end();
  });
}

// Create Return line - create a new return line.
function createReturnLine( response ) {

  var vals = response.values;
  
  helper.query( "INSERT INTO RETURN_LINE( PO_ID, RETURN_LINE_ID, PO_LINE_ID, RETURN_DATE, QTY_RETURNED, CREDIT_MEMO_NUM, COMMENT, AUTHOR) " +
                "VALUES( '" + vals.po_id + "', '" + vals.return_line_id + "', '" + vals.po_line_id + "', '" + vals.return_date +
                "', '" + vals.qty_returned + "', '" + vals.credit_memo_num + "', '" + vals.comment + "', '" + vals.curUserID + "' ) " +
                function( error, rows, cols ) {
    
    console.log( helper.date() + " - " + vals.curUserID + " (" + vals.curRole + ")");

    response.writeHead( 200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });

    if ( error ) {
      console.log( "Error on INSERT into RETURN_LINE: " + error );
      response.write( "Error occured while trying to create return line." );
    } else {
      console.log("Created new return line: " + rows );
      response.write( JSON.stringify( rows ) );
      response.write( "New return line successfully created." );
      historyLog.po( vals, "Change", "Created new return line." );
    }
    
    response.end();
  });
}

// Get Supplier List - get full list of supplier with names and ID.
function getSupplierList( response ) {

  var vals = response.values;
  
  helper.query( "SELECT NAME, SUPPLIER_ID FROM SUPPLIER",
                function( error, rows, cols ) {
    
    if ( error ) {
      console.log( "Error on SELECT from SUPPLIER: " + error );
    } else {
      response.write( JSON.stringify( rows ) );
    }
  });
}

// Get Category List - get full list of category with names.
function getCategoryList( response ) {

  var vals = response.values;
  
  helper.query( "SELECT CAT_NAME FROM ITEM_CATEGORY",
                function( error, rows, cols ) {
    
    if ( error ) {
      console.log( "Error on SELECT from ITEM_CATEGORY: " + error );
    } else {
      response.write( JSON.stringify( rows ) );
    }
  });
}

exports.index = index;
exports.login = login;
exports.logout = logout;
exports.profile = profile;
exports.logs = logs;
exports.editAccount = editAccount;

exports.createUserCheckDupe = createUserCheckDupe;
exports.createUser = createUser;
exports.viewUsers = viewUsers;
exports.viewUsersPage = viewUsersPage;
exports.editUser = editUser;
exports.deleteUser = deleteUser;

exports.createItemCheckDupe = createItemCheckDupe;
exports.createItem = createItem;
exports.viewItems = viewItems;
exports.viewItemsPage = viewItemsPage;
exports.editItem = editItem;
exports.deleteItem = deleteItem;

exports.createPrice = createPrice;
exports.viewPrice = viewPrice;

exports.createSupplierCheckDupe = createSupplierCheckDupe;
exports.createSupplier = createSupplier;
exports.viewSuppliers = viewSuppliers;
exports.viewSuppliersPage = viewSuppliersPage;
exports.editSupplier = editSupplier;
exports.deleteSupplier = deleteSupplier;

exports.createContactPerson = createContactPerson;
exports.viewContactPerson = viewContactPerson;
exports.editContactPerson = editContactPerson;
exports.deleteContactPerson = deleteContactPerson;

exports.createSupplierAddress = createSupplierAddress;
exports.viewSupplierAddress = viewSupplierAddress;
exports.editSupplierAddress = editSupplierAddress;
exports.deleteSupplierAddress = deleteSupplierAddress;

exports.createPurchaseOrder = createPurchaseOrder;
exports.viewPurchaseOrders = viewPurchaseOrders;
exports.viewPurchaseOrdersPage = viewPurchaseOrdersPage;
exports.editPurchaseOrder = editPurchaseOrder;
exports.submitPurchaseOrder = submitPurchaseOrder;
exports.cancelPurchaseOrder = cancelPurchaseOrder;
exports.returnPurchaseOrder = returnPurchaseOrder;
exports.receivePurchaseOrder = receivePurchaseOrder;

exports.createOrderLine = createOrderLine;
exports.viewOrderLine = viewOrderLine;
exports.editOrderLine = editOrderLine;

exports.createReturnLine = createReturnLine;

exports.getSupplierList = getSupplierList;
exports.getCategoryList = getCategoryList;
