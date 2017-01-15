/**
 * HTML로 변환되는 간단한 마크업 언어
 */
global.SML = METHOD(function() {
	'use strict';
	
	var
	// parse.
	parse = function(content, tabCount, appendTabCount) {
		//REQUIRED: content
		//REQUIRED: tabCount
		//REQUIRED: appendTabCount
		
		var
		// html
		html = '',
		
		// tag
		tag,
		
		// sub content
		subContent = '',
		
		// last index
		lastIndex = 0,
		
		// is string mode
		isStringMode,
		
		// is pass mode
		isPassMode,
		
		// parse line.
		parseLine = function(line) {
			
			var
			// now tab count
			nowTabCount = 0,
			
			// value
			value,
			
			// mode ch
			modeCh,
			
			// id
			id = '',
			
			// cls
			cls = '',
			
			// clss
			clss = [];
			
			EACH(line, function(ch) {
				if (ch === '\t') {
					nowTabCount += 1;
				} else {
					return false;
				}
			});
			
			if (line.trim() !== '') {
				
				if (nowTabCount === tabCount) {
					
					line = line.trim();
					
					// ignore comment line.
					if (line[0] !== '#') {
						
						// parse sub html.
						if (subContent !== '') {
							
							if (tag !== undefined) {
								html += '>\n' + parse(subContent, tabCount + 1, appendTabCount);
								subContent = '';
								
								REPEAT(tabCount + appendTabCount + 1, function() {
									html += '\t';
								});
								
								html += '</' + tag + '>\n';
								tag = undefined;
							}
							
							else {
								html += parse(subContent, tabCount + 1, appendTabCount - 1);
								subContent = '';
								
								REPEAT(tabCount + appendTabCount - 1, function() {
									html += '\t';
								});
							}
						}
						
						else if (tag !== undefined && tag !== '\'' && tag !== '`') {
							html += tag === 'meta' || tag === 'link' || tag === 'br' ? '>\n' : (tag === 'script' ? '></script>\n' : ' />\n');
						}
						
						REPEAT(tabCount + appendTabCount + 1, function() {
							html += '\t';
						});
						
						// find tag.
						if (line[0] === '\'') {
							tag = '\'';
							value = line;
						}
						
						else if (line[0] === '`') {
							tag = '`';
							value = line;
						}

						else {
							tag = '';
							EACH(line, function(ch, i) {
								
								if (ch === ' ' || ch === '\t') {
									value = line.substring(i);
									return false;
								}
								
								else if (ch === '#' || ch === '.') {
									
									if (cls !== '') {
										clss.push(cls);
										cls = '';
									}
									
									modeCh = ch;
								}
								
								else {
									if (modeCh === '#') {
										id += ch;
									} else if (modeCh === '.') {
										cls += ch;
									} else {
										tag += ch;
									}
								}
							});
							
							if (cls !== '') {
								clss.push(cls);
								cls = '';
							}
							
							html += '<' + tag;
						}
						
						if (clss.length > 0) {
							value = ' class=\'' + RUN(function() {
								
								var
								// ret
								ret = '';
								
								EACH(clss, function(cls, i) {
									if (i > 0) {
										ret += ' ';
									}
									ret += cls;
								});
								
								return ret;
							}) + '\'' + (value === undefined ? '' : value);
						}
						
						if (id !== '') {
							value = ' id=\'' + id + '\'' + (value === undefined ? '' : value);
						}
						
						// parse value.
						if (value !== undefined) {
							
							RUN(function() {
								
								var
								// attrs
								attrs = '',
								
								// content
								content = '',
								
								// attribute name
								attrName = '',
								
								// last index
								lastIndex = 0,
								
								// is string mode
								isStringMode,
								
								// is pass mode
								isPassMode;
								
								EACH(value, function(ch, i) {
									
									if (isPassMode !== true && ch === '\'' && value[i - 1] !== '\\') {
										if (isStringMode === true) {
											
											if (attrName.trim() === '') {
												
												content += RUN(function() {
													
													var
													// sub content
													subContent = value.substring(lastIndex + 1, i),
													
													// ret
													ret = '',
													
													// now tab count
													nowTabCount = tabCount + 1;
													
													EACH(subContent, function(ch, i) {
														
														if (nowTabCount !== -1) {
															if (ch === '\t') {
																nowTabCount += 1;
																if (nowTabCount === tabCount + 2) {
																	nowTabCount = -1;
																}
															} else {
																nowTabCount = -1;
															}
														}
														
														if (nowTabCount === -1) {
															
															if (ch === '\r' || (ch === '\\' && subContent[i + 1] === '\'')) {
																// ignore.
															} else if (ch === '\n') {
																
																if (ret !== '' && subContent.substring(i).trim() !== '') {
																	ret += '<br>';
																}
																
																ret += '\n';
																
																REPEAT(nowTabCount + appendTabCount + 2, function() {
																	ret += '\t';
																});
																
																nowTabCount = tabCount + 1;
															} else {
																ret += ch;
															}
														}
													});
													
													return ret;
												});
											}
											
											else if (tag === 'meta') {
												attrName = attrName.trim();
												attrName = attrName.substring(0, attrName.length - 1);
												attrs += ' name=' + '"' + attrName + '" content="' + value.substring(lastIndex + 1, i) + '"';
											}
											
											else {
												attrs += attrName + '"' + value.substring(lastIndex + 1, i) + '"';
											}
											
											attrName = '';
						 					
											isStringMode = false;
										} else {
											isStringMode = true;
										}
									}
									
									else if (isStringMode !== true && ch === '`' && value[i - 1] !== '\\') {
										if (isPassMode === true) {
											
											if (attrName.trim() === '') {
												content += value.substring(lastIndex + 1, i);
											}
											
											attrName = '';
						 					
											isPassMode = false;
										} else {
											isPassMode = true;
										}
									}
									
									else if (isStringMode !== true && isPassMode !== true) {
										attrName += ch;
										lastIndex = i + 1;
									}
								});
								
								if (isStringMode === true || isPassMode === true) {
									SHOW_ERROR('[SML] 문자열 구문이 아직 끝나지 않았습니다.', value);
								}
								
								if (content === '') {
									html += attrs;
								} else {
									if (tag === '\'' || tag === '`') {
										html += content + '\n';
									} else {
										html += attrs + '>' + content + '</' + tag + '>\n';
									}
									tag = undefined;
								}
							});
						}
					}
				}
				
				else {
					subContent += line + '\n';
				}
			}
		};
		
		EACH(content, function(ch, i) {
			
			if (ch === '\'' && content[i - 1] !== '\\') {
				if (isStringMode === true) {
					isStringMode = false;
				} else {
					isStringMode = true;
				}
			}
			
			else if (ch === '`' && content[i - 1] !== '\\') {
				if (isPassMode === true) {
					isPassMode = false;
				} else {
					isPassMode = true;
				}
			}
			
			else if (isStringMode !== true && isPassMode !== true && ch === '\n') {
				parseLine(content.substring(lastIndex, i));
				lastIndex = i + 1;
			}
		});
		
		if (isStringMode === true || isPassMode === true) {
			SHOW_ERROR('[SML] 문자열 구문이 아직 끝나지 않았습니다.', content.substring(lastIndex));
		}
		
		else {
			parseLine(content.substring(lastIndex));
		}
		
		if (subContent !== '') {
			
			if (tag !== undefined) {
				html += '>\n' + parse(subContent, tabCount + 1, appendTabCount);
				
				REPEAT(tabCount + appendTabCount + 1, function() {
					html += '\t';
				});
				
				html += '</' + tag + '>\n';
				
				tag = undefined;
			}
			
			else {
				html += parse(subContent, tabCount + 1, appendTabCount - 1);
				
				REPEAT(tabCount + appendTabCount - 1, function() {
					html += '\t';
				});
			}
		}
		
		else if (tag !== undefined && tag !== '\'' && tag !== '`') {
			html += tag === 'meta' || tag === 'link' || tag === 'br' ? '>\n' : (tag === 'script' ? '></script>\n' : ' />\n');
		}
		
		return html;
	};
	
	return {
		
		run : function(content) {
			//REQUIRED: content
			
			var
			// body start index
			bodyStartIndex = content.indexOf('body'),
			
			// head
			head,
			
			// body
			body;
			
			if (content[bodyStartIndex + 5] === '\n' && (bodyStartIndex === 0 || content[bodyStartIndex - 1] === '\n')) {
				head = parse(content.substring(0, bodyStartIndex), 0, 1);
				body = parse(content.substring(bodyStartIndex), 0, 0);
			}
			
			else {
				head = parse(content, 0, 1);
				body = '';
			}
			
			return '<!doctype html>\n<html>\n\t<head>\n\t\t<meta charset="UTF-8">\n' + head + '\t</head>\n' + body + '</html>';
		}
	};
});
