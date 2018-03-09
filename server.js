var express = require("express");
var app = express();
var multer = require('multer');
var path = require('path');
const config = require('./config');

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json());
//setting up file upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

var upload = multer({
    storage: storage
});

var Jimp = require("jimp");
app.post('/uploads', upload.single('image'), (req, res) => {
    let filename = req.file.filename;
    let path = req.file.path;

    // open a file called "lenna.png" 
    Jimp.read(path, function (err, lenna) {
        if (!err) {
            
            lenna.resize(240, 240)
                .write('public/img/thumbs/' + filename);
            lenna.resize(80, 80)
                .write('public/img/small/' + filename, ()=>{

                    console.log('done!')
                    return res.json({
                        filename: filename
                    });
                });

        }else{
            return res.json({
                message: 'Error processing image!'
            });
        }
    });
});

app.set('view engine', 'ejs');
app.use(express.static('public'))

const util = require('./util');

//home page
app.get('/', (req, res) => {
    get_home_page_items().then((rows) => {

        getAllMenuNoTags().then((rows2)=>{

            let listMenuHome = [];
    
            let seen = {};
    
            for (let item of rows[0]) {
                if(!seen[item.menu_name]){
                    seen[item.menu_name] = true;
    
                    let menu = {
                        menu_id:item.menu_id,
                        menu_name:item.menu_name,
                        slugUrl:'/' + util.slugify(item.menu_name) + '-c' + item.category_id,
                        items:[],
                        children:[]
                    }
                    for(let item2 of rows[0]){
                        if(item2.menu_id == menu.menu_id){
                            menu.items.push(item2);
                            item2.slugUrl = '/' + util.slugify(item2.item_name) + '-p' + item2.item_id;

                        }
                    }

                    for(let child of rows2){
                        if(child.parent_id == menu.menu_id){
                            menu.children.push(child);
                            if(child.category_id){
                                child.slugUrl = '/' + util.slugify(child.menu_name) + '-c' + child.category_id;
                            }else{
                                child.slugUrl = 'javascript:void:;';
                            }
                        }
                    }
    
                    listMenuHome.push(menu);
                }
            }
    
    
            res.render('home_page', 
                {
                    listMenuHome,
                    formatPrice,
                    keyword:""
                
                });
        })
    })
})

function formatPrice(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
;}


//item page
app.get(/^\/[a-z0-9-]+[a-z]-p(\d+)$/, function (req, res) {
    let patt = /^\/[a-z0-9-]+[a-z]-p(\d+)$/;
    let url = req.url;

    var match = patt.exec(url);
    let itemId = match[1];

    getItem(itemId).then((rows) => {

        let item = rows[0];
        if (item && item.category_id) {
            let categoryId = item.category_id;
            let parents = [];
            getAllCategories().then((rows) => {
                let currentCat = null;
                for (let category of rows) {
                    if (category.category_id == categoryId) {
                        currentCat = category;
                        currentCat.active = 'active';
                        break;
                    }
                }

                for (let category of rows) {
                    category.slugUrl = '/' + util.slugify(category.category_name) + '-c' + category.category_id;
                }

                findParentRecursive(currentCat);

                parents = parents.reverse();

                function findParentRecursive(category) {
                    if (category && category.parent_id) {

                        for (let c of rows) {
                            if (c.category_id == category.parent_id) {
                                parents.push(c);
                                findParentRecursive(c);
                                break;
                            }
                        }
                    }
                }
                let specs = [];
                try{

                    specs = JSON.parse(item.specs);
                }catch(ex){}
                console.log(item)
                get_relate_items(item.item_id).then((rows)=>{
                    let relatedItems = rows[0];
                        for(let item of relatedItems){
                            console.log(item);
                            if(item && item.item_name){
                                item.slugUrl = '/' + util.slugify(item.item_name) + '-p' + item.item_id;
                            }
                        }
                    res.render('item_details', {
                        currentCat,
                        parents,
                        item,
                        keyword:"",
                        specs,
                        relatedItems,
                        formatPrice
    
                    });
                })

            })
        } else {
            res.render('page_not_found');
        }
    })


});

//category page
app.get(/(^\/[a-z-]+[a-z]-c(\d+)$)|(^\/tim-kiem$)/, function (req, res) {

    let patt = /^\/[a-z-]+[a-z]-c(\d+)$/;
    let url = req.url;
    url = url.split("?")[0];

    console.log(url)
    var match = patt.exec(url);
    let categoryId = -1;
    if (match) {
        categoryId = match[1];
    }

    let search = false;

    if (url.startsWith('/tim-kiem')) {
        let id = req.query.cat;
        if (id) {
            categoryId = id;
        }
        search = true;
    }


    console.log('categoryId:' + categoryId)
    //find parent up to root, find all siblings, find all direct child

    let children = [];
    let siblings = [];
    let parents = [];

    if (categoryId != -1) {
        getAllCategories().then((rows) => {
            let currentCat = null;
            console.log("current cat:")
            for (let category of rows) {
                if (category.category_id == categoryId) {
                    currentCat = category;
                    currentCat.active = 'active';
                    break;
                }
            }

            for (let category of rows) {
                category.slugUrl = '/' + util.slugify(category.category_name) + '-c' + category.category_id;

                if (category.parent_id == currentCat.category_id) {
                    children.push(category);
                }

                if (category.parent_id == currentCat.parent_id) {
                    siblings.push(category);
                }
            }

            findParentRecursive(currentCat);

            function findParentRecursive(category) {
                if (category && category.parent_id) {

                    for (let c of rows) {
                        if (c.category_id == category.parent_id) {
                            parents.push(c);
                            findParentRecursive(c);
                        }
                    }
                }
            }

            handleRequest(req, res, currentCat);



        })
    } else {
        console.log('go here')

        let children = [];
        let siblings = [];
        let parents = []
        handleRequest(req, res, null)
    }

    function handleRequest(req, res, currentCat) {
        let keyword = req.query.text;
        keyword = keyword || '';

        let categoryId = -1;
        if (currentCat) {
            categoryId = currentCat.category_id;
        }

        //reset keyword if url is not /tim-kiem
        if (!url.startsWith('/tim-kiem')) {
            keyword = '';
        }


        //thống kê brand trong list sp tìm đc
        countBrandInCategory(categoryId, keyword).then((rows) => {
            console.log(categoryId);

            //xu ly chuỗi brands
            let brands = rows[0];

            let selectedBrands = req.query.brand;
            selectedBrands = selectedBrands || '';

            let totalItem = 0;


            if (selectedBrands.length) {
                //reformat to '1,2,3'
                //cac brand co format dang b1b2b3, can tach chu 'b' ra va split
                selectedBrands = selectedBrands.substring(1, selectedBrands.length);
                selectedBrands = selectedBrands.replace(/b/g, "-");
            }

            for (let brand of brands) {
                totalItem += brand.total;

                //mark selected brands 
                console.log("selected brands:" + selectedBrands);
                //TODO: regex to test if selectedBrands like b1b2b3 ...
                if (selectedBrands.length) {

                    let tempBrands = selectedBrands.split('-');
                    console.log(tempBrands);
                    for (let id of tempBrands) {
                        if (brand.brand_id == id) {
                            brand.selected = true;
                            console.log(brand.brand_id)
                            break;
                        }
                    }
                }
            }


            //xu ly sort
            let currentSortText = 'Sắp xếp theo';

            let sort = req.query.sort;
            let order = -1;
            if (sort) {
                sort = sort.toUpperCase()
                if (sort == 'ASC') {
                    order = 0;
                    currentSortText = 'Giá tăng dần'
                }

                if (sort == 'DESC') {
                    order = 1;

                    currentSortText = 'Giá giảm dần'
                }
            }

            //xu ly paging
            let currentPage = req.query.page;

            if (isNaN(currentPage)) {
                currentPage = 1;
            }
            currentPage = parseInt(currentPage);

            let pageSize = config.PAGE_SIZE;
            let totalPage = Math.ceil(totalItem / pageSize);


            get_item_in_category(categoryId, selectedBrands, keyword, order, currentPage, pageSize).then((rows) => {
                console.log(rows[0]);

                let items = rows[0];
                if(items && items.length){
                    for(let item of items){
                        item.slugUrl = '/' + util.slugify(item.item_name) + '-p' + item.item_id;
                    }
                }else{
                    items = [];
                }

                res.render('category_detail', {
                    currentCat,
                    parents,
                    siblings,
                    children,
                    brands,
                    items,
                    selectedBrands,
                    totalItem,
                    currentSortText,
                    sort, //asc hoac desc
                    currentPage,
                    totalPage,
                    keyword,
                    search, //phan biet dang o trang category hay trang tim kiem
                    formatPrice
                });
            })


        });
    }

});


app.get('/admin/quan-ly-san-pham', (req, res) => {

    res.render('manage-item');
});

app.get('/admin/quan-ly-nhom-hang', (req, res) => {

    res.render('manage-category');
});

app.get('/admin/quan-ly-nhan', (req, res) => {

    res.render('manage_tag');
});

app.get('/admin/quan-ly-menu', (req, res) => {

    res.render('manage-menu');
});

app.get('/findItemByName', (req, res) => {
    let text = req.query.name;
    findItemByName(text).then((data) => {
        res.json(data);

    })
});
app.get('/categories', (req, res) => {
    getAllCategories().then((rows) => {
        res.json(rows);
    });
})
app.get('/menu', (req, res) => {
    getAllMenu().then((rows) => {
        res.json(rows);
    });
})

app.get('/tags', (req, res) => {
    getAllTags().then((rows) => {
        res.json(rows);
    });
})
app.get('/tagsByItem', (req, res) => {
    let itemId = req.query.id;
    console.log("id:" + itemId);
    if(!isNaN(itemId)){
        getItemTags(itemId).then((rows)=>{
            console.log('rows',rows)
            res.json(rows);
        })
    }else{
        return false;
    }
})

app.get('/brands', (req, res) => {
    getAllBrands().then((rows) => {
        res.json(rows);
    });
})

app.post(/^\/remove-item\/(\d+)$/, function (req, res) {
    let patt = /^\/remove-item\/(\d+)$/;
    let url = req.url;
    console.log("url:" + url)
    var match = patt.exec(url);
    console.log(match);
    let itemId = -1;
    if (match) {
        itemId = match[1];
    }
    console.log("remove id2:" + itemId)
    removeItem(itemId).then((rows) => {
        console.log(rows)
        res.json({
            message: 'OK'
        });
    })
})

app.post('/brand', function (req, res) {
    let data = req.body;
    console.log(data)
    let brandName = data.brandName;
    
    if(brandName){
    
        addBrand(brandName).then((rows)=>{
            console.log(rows);
            res.json(rows)
        })
    }
});

app.post('/tag', function (req, res) {
    let data = req.body;
    console.log(data)
    let tagName = data.tagName;

    let tagId = data.tagId;
    console.log("tagId:" + tagId)
    if(!tagId){
    
        addTag(tagName).then((rows)=>{
            console.log(rows);
            res.json(rows)
        })
    }else {
        updateTag(tagId, tagName).then((rows)=>{
            console.log(rows);
            res.json(rows)
        })
    }
});

app.post('/category', function (req, res) {
    let data = req.body;
    console.log(data)
    let categoryName = data.categoryName;
    let categoryId = data.categoryId;
    
    let parentId = data.parentId;
    if(!parentId){
        parentId = null;
    }
    let searchable = data.searchable;
    if(categoryId){

        updateCategory(categoryId, categoryName, parentId, searchable).then(()=>{
            res.json({
                message:'OK'
            })
        })
    }else{
        addCategory(categoryName, parentId, searchable).then((rows)=>{
            console.log(rows);
            res.json(rows)
        })
    }
});

app.post('/menu', function (req, res) {
    let data = req.body;
    console.log(data)
    let menuName = data.menuName;
    let menuId = data.menuId;
    
    let parentId = data.parentId;
    if(!parentId){
        parentId = null;
    }
    let tagIds = data.tagIds;
    let priority = data.priority;
    let active = data.active;
    let categoryId = data.categoryId;

    if(menuId){

        updateMenu(menuId, menuName, parentId, tagIds, priority, active, categoryId).then(()=>{
            res.json({
                message:'OK'
            })
        })
    }else{
        addMenu(menuName, parentId, tagIds, priority, active, categoryId).then((rows)=>{
            console.log(rows);
            res.json(rows)
        })
    }
});


app.post('/item', function (req, res) {
    let data = req.body;
    let name = data.name || '';
    let code = data.code || '';
    let sku = data.sku || '';
    let categoryId = data.category || '';
    let brandId = data.brand || '';
    let price = data.price || '';
    let price_final = data.price_final || '';
    let stock = data.stock || '';
    let desc = data.description || '';
    let shortdesc = data.shortdesc || '';
    let img1 = data.img1 || '';
    let img2 = data.img2 || '';
    let img3 = data.img3 || '';
    let img4 = data.img4 || '';
    let origin = data.origin || '';
    let warranty = data.warranty || '';
    let specs = JSON.stringify(data.specs) || '';
    let unit = data.unit || '';

    let tags = data.tags || [];

    let itemId = data.item_id;

    updateItem(itemId, categoryId, brandId, code, sku, name, price, price_final, stock, shortdesc, desc, specs, img1, img2, img3, img4, origin, unit, warranty, tags).then(() => {
        res.json({
            message: 'OK'
        });
    })
});


function addBrand(brandName){
    let query = `CALL sp_insert_brand(?)`;
    return db.query(query,[brandName]);
}

function addTag(tagName){
    let query = `CALL sp_insert_tag(?)`;
    return db.query(query,[tagName]);
}

function updateTag(tagId, tagName){
    let query = `CALL sp_update_tag(?,?)`;
    return db.query(query,[tagId, tagName]);
}

function addMenu(menuName, parentId, tagIds, priority, active, categoryId){
    let query = `CALL sp_insert_menu(?,?,?,?,?,?)`;
    return db.query(query,[menuName, parentId, tagIds, priority, active, categoryId]);
}

function updateMenu(menuId,menuName, parentId, tagIds, priority, active, categoryId){
    let query = `CALL sp_update_menu(?,?,?,?,?,?,?)`;
    return db.query(query,[menuId,menuName, parentId, tagIds, priority, active, categoryId]);
}

function addCategory(categoryName, parentId, searchable){
    let query = `CALL sp_insert_category(?,?,?)`;
    return db.query(query,[categoryName, parentId, searchable]);
}

function updateCategory(categoryId, categoryName, parentId, searchable){
    let query = `CALL sp_update_category(?,?,?,?)`;
    return db.query(query,[categoryId, categoryName, parentId, searchable]);
}

function updateItem(itemId, categoryId, brandId, code, sku, name, price, price_final, stock, shortdesc, desc, specs, img1, img2, img3, img4, origin, unit, warranty, tags) {
    let query;
    console.log("update item, id = " + itemId);


    //convert array of id to seperated comma string
    let tagIds = tags.toString();
    console.log(tagIds);
    if (itemId) {
        query = `CALL sp_update_item(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        return db.query(query, [itemId, categoryId, brandId, code, sku, name, price, price_final, stock, shortdesc, desc, specs, img1, img2, img3, img4, origin, unit, warranty, tagIds]);
    } else {
        query = `CALL sp_insert_item(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        return db.query(query, [categoryId, brandId, code, sku, name, price, price_final, stock, shortdesc, desc, specs, img1, img2, img3, img4, origin, unit, warranty, tagIds]);
    }
}
let db = require('./db');

function get_home_page_items(){
    return db.query(`CALL sp_get_homepage_item()`);
}

function get_relate_items(itemId){
    let query = `CALL sp_get_related_item(?)`;
    return db.query(query, [itemId]);
}

function get_item_in_category(categoryId, brandStr, keyword, priceOrder, pageIndex, pageSize) {

    let delim = '-';
    keyword = keyword || '';
    categoryId = categoryId || 1;

    if (isNaN(pageIndex)) {
        pageIndex = 1;
    }
    pageIndex = parseInt(pageIndex);

    if (isNaN(priceOrder)) {
        priceOrder = -1;
    } else {
        priceOrder = parseInt(priceOrder);
    }

    let query = `CALL sp_get_item_in_category(${categoryId},'${brandStr}','${delim}','${keyword}',${priceOrder},${pageIndex},${pageSize})`;
    console.log(query)
    return db.query(query);
}

function countBrandInCategory(categoryId, keyword) {
    keyword = keyword || '';
    categoryId = categoryId || -1;
    console.log('categoryId:' + categoryId + ', keyword:' + keyword)
    let query = `CALL sp_count_brand_from_category(${categoryId}, "${keyword}")`;
    console.log(query);
    return db.query(query);
}

function getAllBrands() {

    return db.query("SELECT * FROM brand");
}



function getAllCategories() {

    return db.query("SELECT * FROM category");
}
function getAllMenuNoTags() {
    return db.query("SELECT * FROM menu");
}
function getAllMenu() {
    return db.query("SELECT m.*, (SELECT GROUP_CONCAT(mt.tag_id SEPARATOR ',') FROM menu_tag mt WHERE mt.menu_id = m.menu_id) as tagIds FROM menu m");
}

function getAllTags() {
    return db.query("SELECT * FROM tag");
}

function findItemByName(text) {
    let query = `CALL sp_find_item(?)`;
    return db.query(query, [text])
}

function getItemTags(itemId) {
    return db.query("SELECT t.tag_id, t.tag_name FROM tag t INNER JOIN item_tag i ON t.tag_id = i.tag_id WHERE i.item_id = ?",[itemId]);
}

function getItem(itemId) {

    let query = `SELECT * FROM item WHERE item_id = ?`;

    return db.query(query, [itemId])
}


function removeItem(itemId) {

    let query = `CALL sp_remove_item(?)`;
    console.log("remove id:" + itemId)
    return db.query(query, [itemId])
}


app.listen(8000);
console.log('server run at http://localhost:8000');