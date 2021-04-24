package com.example.webrtc.controller;

import com.alibaba.fastjson.JSON;
import com.example.webrtc.bean.User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @program: webrtc
 * @description:
 * @author: Zhangxike
 * @create: 2021-04-24 00:15
 **/

@Controller
@RequestMapping(value ="/login")
public class LoginController{

    @ResponseBody
    @PostMapping("/get_login_user_info_data")
    public String getUserInfo(){
        User user = new User();
        user.setName("用户-"+ (int) (Math.random() * 10)+System.currentTimeMillis());
        return JSON.toJSONString(user);
    }

    @RequestMapping(value ="/index")
    public String index(){
        return "/index";
    }

    @ResponseBody
    @RequestMapping(value ="/t")
    public String monitor(){
        return "status is up";
    }


}
