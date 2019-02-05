const express = require("express");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = express.Router({ mergeParams: true });

const validateFields = (req, res, next) => {
  const menuItem = req.body.menuItem;

  if (!menuItem.name || !menuItem.description || !menuItem.inventory || !menuItem.price) {
    res.status(400).send();    
  } else {
    req.menuItem = menuItem;
    next();
  }
};

const getMenuItemById = (id, callback) => {
  db.get("SELECT * FROM MenuItem WHERE id = $id", { $id: id }, callback);
};

menuItemsRouter.param("menuItemId", (req, res, next, id) => {
  getMenuItemById(id, (error, row) => {
    if (row) {
      req.menuItemId = id;
      req.menuItem = row;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menuItemsRouter.get("/", (req, res) => {
  db.all(
    "SELECT * FROM MenuItem WHERE menu_id = $id", 
    { $id: req.menuId }, 
    (error, rows) => {
      res.send({ menuItems: rows });
    });
});

menuItemsRouter.post("/", validateFields, (req, res) => {
  const menuItem = req.menuItem;

  db.run(
    "INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)",
    { 
      $name: menuItem.name, 
      $description: menuItem.description, 
      $inventory: menuItem.inventory, 
      $price: menuItem.price, 
      $menuId: req.menuId 
    },
    function(error) {
      if (error) {
        next(error);
        return;
      }
      getMenuItemById(this.lastID, (error, row) => {        
        res.status(201).send({ menuItem: row });
      });      
    });
});

menuItemsRouter.put("/:menuItemId", validateFields, (req, res, next) => {
  const menuItem = req.menuItem;

  db.run(
    "UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE id = $id",
    { 
      $id: req.menuItemId,
      $name: menuItem.name, 
      $description: menuItem.description, 
      $inventory: menuItem.inventory, 
      $price: menuItem.price      
    },
    function(error) {
      if (error) {
        next(error);
        return;
      }
      getMenuItemById(req.menuItemId, (error, row) => {        
        res.status(200).send({ menuItem: row });
      });      
    });
});

menuItemsRouter.delete("/:menuItemId", (req, res, next) => {
  db.run(
    "DELETE FROM MenuItem WHERE id = $id",
    { $id: req.menuItemId },
    function(error) {
      if (error) {
        next(error);
        return;
      }      
      res.sendStatus(204);
    });
});


module.exports = menuItemsRouter;