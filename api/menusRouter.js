const express = require("express");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menuItemsRouter = require("./menuItemsRouter");

const menusRouter = express.Router();

const validateFields = (req, res, next) => {
  const menu = req.body.menu;

  if (!menu.title) {
    res.status(400).send();    
  } else {
    req.menu = menu;
    next();
  }
};

const getMenuById = (id, callback) => {
  db.get("SELECT * FROM Menu WHERE id = $id", { $id: id }, callback);
};

menusRouter.param("id", (req, res, next, id) => {
  getMenuById(id, (err, row) => {
    if (row) {
      req.menuId = id;
      req.menu = row;
      next();
    } else {
      res.status(404).send();
    }
  });
});

menusRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Menu", (err, rows) => {
    res.send({ menus: rows });
  })
});

menusRouter.get("/:id", (req, res, next) => {
  res.send({ menu: req.menu });  
});

menusRouter.post("/", validateFields, (req, res, next) => {
  const menu = req.menu;

  db.run(
    "INSERT INTO Menu (title) VALUES ($title)",
    { $title: menu.title },
    function(error) {
      if (error) {
        next(error);
        return;
      }
      getMenuById(this.lastID, (error, row) => {
        res.status(201).send({ menu: row });
      });
    });
});

menusRouter.put("/:id", validateFields, (req, res, next) => {
  const menu = req.menu;

  db.run(
    "UPDATE Menu SET title = $title WHERE id = $id",
    { $id: req.menuId, $title: menu.title },
    (error) => {
      if (error) {
        next(error);
        return;
      }
      getMenuById(req.menuId, (error, row) => {
        res.status(200).send({ menu: row });
      });
    });
});    

menusRouter.delete("/:id", (req, res) => {
  db.get(
    "SELECT * FROM MenuItem WHERE menu_id = $id",
    { $id: req.menuId },
    (error, row) => {
      if (row) {
        res.sendStatus(400);
      } else {
        db.run(
          "DELETE FROM Menu WHERE id = $id",
          { $id: req.menuId },
          (error) => {
            if (error) {
              next(error);
              return;
            }
            res.sendStatus(204);      
          });
      }      
    });  
});

menusRouter.use("/:id/menu-items", menuItemsRouter);

module.exports = menusRouter;