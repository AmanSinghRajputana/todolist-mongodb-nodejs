//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express();
const _ = require("lodash");
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
mongoose.set("strictQuery", false);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });


const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to the todolist."
});
const item2 = new Item({
  name: "Hit the + button to add more items into the list."
});
const item3 = new Item({
  name: "<-- hit this button to delete an item from the list."
});
const defaultItems = [item1, item2, item3];



const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function (result) {
            console.log("successfully inserted into the database.")
          })
          .catch(function (err) {
            console.log(err);
          })
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }

    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
 
  const item = new Item ({
    name: itemName
  });
 
  if (listName === "Today") {
    item.save().then(() => console.log("new Item added to main todolist."));
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then(function(foundList){
      foundList.items.push(item);
      foundList.save().then(() => console.log("Success!!"));
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err)
    })
  }
});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

if (listName === "Today") {
  Item.findByIdAndRemove(checkedItemId)
    .then(function (result) {
      console.log("found Item is deleted.");
    })
    .catch(function (err) {
      console.log(err);
    })
  res.redirect("/");
} else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(function(foundList){
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err)
    });
}
});
app.get("/about", function (req, res) {
  res.render("about");
});
app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}`);
});