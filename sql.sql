
select * from category

/*
	list all child categories belong to parent category
*/
go;
select  category_id,
        category_name,
        parent_id 
from    (select * from category
         order by parent_id, category_id) products_sorted,
        (select @pv := '1') initialisation
where   find_in_set(parent_id, @pv) > 0
and     @pv := concat(@pv, ',', category_id);


SELECT    c0.category_name  AS level0,
		  c0.category_id  AS level0_id,
          c1.category_name  AS level1,
          c1.category_id  AS level1_id,
          c2.category_name  AS level2,
          c2.category_id  AS level2_id,
          c3.category_name  AS level3,
          c3.category_id  AS level3_id,
          c4.category_name  AS level4,
          c4.category_id  AS level4_id,
          c5.category_name  AS level5,
          c5.category_id  AS level5_id
FROM      category c0
LEFT JOIN category c1 ON c1.parent_id = c0.category_id
LEFT JOIN category c2 ON c2.parent_id = c1.category_id
LEFT JOIN category c3 ON c3.parent_id = c2.category_id
LEFT JOIN category c4 ON c4.parent_id = c3.category_id
LEFT JOIN category c5 ON c5.parent_id = c4.category_id
WHERE     c0.parent_id IS NULL
ORDER BY  c0.category_id, c1.category_id, c2.category_id, c3.category_id, c4.category_id, c5.category_id


/*get item by category*/
DELIMITER //
CREATE PROCEDURE sp_get_item_in_category
(
	IN categoryId INT, 
  	IN pageIndex INT,
    IN pageSize INT
)
BEGIN
        DECLARE LowerBound INT;
        DECLARE UpperBound INT;
        SET LowerBound = (pageIndex - 1) * pageSize ;
        SET UpperBound = pageIndex * pageSize  ;

        SELECT item_id, item_name, price, sale, image01, image02 
        FROM item WHERE category_id 
        IN
                (
                        SELECT  category_id
                        FROM	(SELECT * FROM category	 ORDER BY parent_id, category_id) products_sorted,
                                        (SELECT @pv := categoryId) initialisation
                        WHERE   find_in_set(parent_id, @pv) > 0
                        AND     @pv := concat(@pv, ',', category_id 
        )
        UNION 
                SELECT category_id FROM category
                WHERE category_id = categoryId
        )
        
        LIMIT LowerBound, UpperBound
    ;


END //
DELIMITER ;


CALL sp_get_item_in_category(1,1,5)




/*store procedure thong ke theo brand*/

DELIMITER //
CREATE PROCEDURE sp_count_brand_from_category
(IN categoryId INT)
BEGIN
	SELECT i.brand_id, b.brand_name, COUNT(*) as total 
        FROM item i
	INNER JOIN brand b
	ON i.brand_id = b.brand_id
	WHERE category_id IN
	(SELECT  category_id
		FROM    (
			SELECT * 
			FROM category
			ORDER BY parent_id, category_id) products_sorted,
				(
					SELECT @pv := categoryId) initialisation
					WHERE   find_in_set(parent_id, @pv) > 0
					AND     @pv := concat(@pv, ',', category_id 
				)
		UNION 
			SELECT category_id FROM category
			WHERE category_id = categoryId

	)
	GROUP BY brand_id;
END //
DELIMITER ;

CALL sp_count_brand_from_category(1)
