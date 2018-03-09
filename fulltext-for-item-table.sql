ALTER TABLE item
ADD FULLTEXT INDEX `FullTextOnItem_name` 
(`item_name` ASC);

SELECT * FROM  item 
WHERE MATCH (item_name) AGAINST ("")