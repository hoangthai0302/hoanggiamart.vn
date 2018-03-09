DELIMITER //
CREATE PROCEDURE sp_get_item_in_category
(
	IN categoryId INT,
    IN brandStr VARCHAR(50),
    IN delim VARCHAR(1),
    IN keyword VARCHAR(200),
    IN priceOrder VARCHAR(10),
  	IN pageIndex INT,
    IN pageSize INT
)
BEGIN

	DECLARE LowerBound INT;
	DECLARE UpperBound INT;
	DECLARE rownum INT;
	SET LowerBound = (pageIndex - 1) * pageSize ;
	SET UpperBound = pageIndex * pageSize  ;
    

     CALL splitter(brandStr, delim);
    
    
	SELECT item_id, brand_id, item_name, price, sale, image01, image02 
    FROM item WHERE
    CASE
		WHEN (keyword IS NOT NULL AND keyword <> '')
			THEN MATCH (item_name) AGAINST (keyword)
		ELSE TRUE
	END
    
    AND 
    
    CASE
		WHEN categoryId <> -1
			THEN (category_id	 
					IN
					(
						SELECT  category_id
						FROM	(SELECT * FROM category	 ORDER BY parent_id, category_id) products_sorted, (SELECT @pv := categoryId) initialisation
						WHERE   find_in_set(parent_id, @pv) > 0
						AND     @pv := concat(@pv, ',', category_id)
					
						UNION 
						SELECT category_id FROM category
						WHERE category_id = categoryId
					)
            
            )
			
       ELSE TRUE  
	END   
    
   	
    AND
    (
		CASE
		WHEN brandStr <> '' 
		THEN brand_id IN (SELECT * FROM splitResults)
        ELSE TRUE
		END
    )

    ORDER BY 
    CASE priceOrder WHEN 0 THEN price END ASC,
	CASE WHEN priceOrder = 1  THEN price END DESC
      
    LIMIT LowerBound, UpperBound   ;


END //
DELIMITER ;


CALL sp_get_item_in_category(2,'','-','',null,1,20);

CALL sp_get_item_in_category(-1,'','-','inox',-1,1,10)


CREATE FUNCTION stringSplit(
x VARCHAR(255),
delim VARCHAR(12),
pos INT)
RETURNS VARCHAR(255)
RETURN REPLACE(SUBSTRING(SUBSTRING_INDEX(x, delim, pos),
LENGTH(SUBSTRING_INDEX(x, delim, pos -1)) + 1), delim, '');


DELIMITER //
CREATE FUNCTION `substrCount`(s VARCHAR(255), ss VARCHAR(255)) RETURNS tinyint(3) unsigned
READS SQL DATA
BEGIN
DECLARE count TINYINT(3) UNSIGNED;
DECLARE offset TINYINT(3) UNSIGNED;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET s = NULL;
SET count = 0;
SET offset = 1;
REPEAT
IF NOT ISNULL(s) AND offset > 0 THEN
SET offset = LOCATE(ss, s, offset);
IF offset > 0 THEN
SET count = count + 1;
SET offset = offset + 1;
END IF;
END IF;
UNTIL ISNULL(s) OR offset = 0 END REPEAT;
RETURN count;
END //
DELIMITER ;


DELIMITER //
CREATE PROCEDURE `splitter`(x varchar(255), delim varchar(12))
BEGIN
	SET @Valcount = substrCount(x,delim)+1;
	SET @v1=0;
	drop table if exists splitResults;
	create temporary
	table splitResults (split_value varchar(255));
    
	WHILE (@v1 < @Valcount) DO
		set @val = stringSplit(x,delim,@v1+1);
		INSERT INTO splitResults (split_value) VALUES (@val);
		SET @v1 = @v1 + 1;
	END WHILE;

END //
DELIMITER ;

CALL splitter('1,2,3,4,5', ',');
SELECT * FROM splitResults;



